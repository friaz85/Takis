<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Models\SecurityLogModel;
use CodeIgniter\RESTful\ResourceController;
use Firebase\JWT\JWT;
use App\Libraries\EmailSender;

class AuthController extends ResourceController
{
    protected $modelName = 'App\Models\UserModel';
    protected $format = 'json';
    private $key = 'kYiFLGycgRRp31CIOcwRASFw5e5JOqu6D/LKt+AaYlWMGAKlK/gYq9SlB1j9m2Bl/lqBs6l6fQaJat5riEtEPA==';

    public function register()
    {
        $userModel = new UserModel();
        $logModel  = new SecurityLogModel();

        $rules = [
            'name'  => 'required',
            'email' => 'required|valid_email',
            'phone' => 'required'
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $ip = $this->request->getIPAddress();

        // Check if IP is Banned
        $isIpBanned = $logModel->where('ip_address', $ip)
            ->where('action', 'auto_block')
            ->countAllResults() > 0;

        if ($isIpBanned) {
            return $this->fail('Por el momento no se puede realizar el registro. Favor de comunicarse a atención a clientes. Código de error (-15)', 403);
        }

        $email = $this->request->getVar('email');
        $phone = $this->request->getVar('phone');

        // Validate unique phone number
        $userWithPhone = $userModel->where('phone', $phone)->first();
        if ($userWithPhone && $userWithPhone['email'] !== $email) {
            return $this->fail('El teléfono ya está registrado', 400);
        }

        $otp       = rand(100000, 999999);
        $otpExpiry = date('Y-m-d H:i:s', strtotime('+10 minutes'));

        $existingUser = $userModel->where('email', $email)->first();

        if ($existingUser && isset($existingUser['is_blocked']) && (int) $existingUser['is_blocked'] === 1) {
            return $this->fail("Inicio de sesión restringido, favor de comunicarse al servicio al cliente", 403);
        }

        if ($existingUser) {
            $userModel->update($existingUser['id'], [
                'otp'        => $otp,
                'otp_expiry' => $otpExpiry,
                'phone'      => $this->request->getVar('phone') ?? $existingUser['phone'],
                'full_name'  => $this->request->getVar('name') ?? $existingUser['full_name']
            ]);
            $contactName = $existingUser['full_name'];
        } else {
            $randomPass = uniqid('user_', true);
            $data       = [
                'full_name'     => $this->request->getVar('name'),
                'email'         => $email,
                'phone'         => $this->request->getVar('phone'),
                'otp'           => $otp,
                'otp_expiry'    => $otpExpiry,
                'is_verified'   => 0,
                'password_hash' => password_hash($randomPass, PASSWORD_BCRYPT)
            ];

            $userId      = $userModel->insert($data);
            $contactName = $data['full_name'];

            if (!$userId) {
                return $this->failServerError('Error writing to database.');
            }
        }

        $this->sendOtpEmail($email, $contactName, $otp);

        return $this->respondCreated(['status' => 'success', 'message' => 'Código enviado a tu correo.']);
    }

    public function requestLoginOtp()
    {
        $userModel = new UserModel();
        $logModel  = new SecurityLogModel();
        $email     = $this->request->getVar('email');
        $ip        = $this->request->getIPAddress();

        // Check if IP is Banned
        $isIpBanned = $logModel->where('ip_address', $ip)
            ->where('action', 'auto_block')
            ->countAllResults() > 0;

        if ($isIpBanned) {
            return $this->fail('Acceso restringido por seguridad. Código de error (-20)', 403);
        }

        $user = $userModel->where('email', $email)->first();

        if (!$user) {
            return $this->failNotFound('El correo aún no se encuentra registrado, verifícalo o regístrate.');
        }

        if (isset($user['is_blocked']) && (int) $user['is_blocked'] === 1) {
            return $this->fail("Inicio de sesión restringido, favor de comunicarse al servicio al cliente", 403);
        }

        $otp = rand(100000, 999999);
        $userModel->update($user['id'], [
            'otp'        => $otp,
            'otp_expiry' => date('Y-m-d H:i:s', strtotime('+10 minutes'))
        ]);

        $this->sendOtpEmail($email, $user['full_name'], $otp);

        return $this->respond(['status' => 'success', 'message' => 'Código de acceso enviado a tu correo.']);
    }

    public function verifyOtp()
    {
        $userModel = new UserModel();
        $logModel  = new SecurityLogModel();

        $email = $this->request->getVar('email');
        $otp   = $this->request->getVar('otp');
        $ip    = $this->request->getIPAddress();

        // Check if IP is Banned
        $isIpBanned = $logModel->where('ip_address', $ip)
            ->where('action', 'auto_block')
            ->countAllResults() > 0;

        if ($isIpBanned) {
            return $this->fail('Acceso restringido por seguridad. Código de error (-20)', 403);
        }

        $user = $userModel->where('email', $email)->first();

        if (!$user) {
            return $this->failNotFound('Usuario no encontrado.');
        }

        // Check if user is blocked
        if (isset($user['is_blocked']) && (int) $user['is_blocked'] === 1) {
            $logModel->save([
                'ip_address' => $ip,
                'user_id'    => $user['id'],
                'action'     => 'login_blocked',
                'details'    => 'Usuario bloqueado intentó acceder'
            ]);

            return $this->fail("Inicio de sesión restringido, favor de comunicarse al servicio al cliente", 403);
        }

        // VERIFY OTP
        if ($user['otp'] == $otp && strtotime($user['otp_expiry']) > time()) {

            $userModel->update($user['id'], ['is_verified' => 1, 'otp' => null, 'otp_expiry' => null]);

            $logModel->save([
                'ip_address' => $ip,
                'user_id'    => $user['id'],
                'action'     => 'login_success',
                'details'    => 'OTP Verified'
            ]);

            $payload = [
                'iat'   => time(),
                'exp'   => time() + (60 * 60 * 24 * 30),
                'id'    => $user['id'],
                'email' => $user['email']
            ];

            $token = JWT::encode($payload, $this->key, 'HS256');

            return $this->respond([
                'status'  => 'success',
                'message' => 'Código verificado.',
                'token'   => $token,
                'user'    => [
                    'id'     => $user['id'],
                    'name'   => $user['full_name'],
                    'email'  => $user['email'],
                    'points' => $user['points'],
                    'role'   => $user['role'] ?? 'user'
                ]
            ]);
        }

        // --- OTP FAILED ---
        $logModel->save([
            'ip_address' => $ip,
            'user_id'    => $user['id'],
            'action'     => 'login_failed',
            'details'    => 'Invalid or Expired OTP'
        ]);

        // 🛡️ ANTI-BRUTE FORCE CHECK (5 attempts in 1 minute)
        $oneMinuteAgo = date('Y-m-d H:i:s', strtotime('-1 minute'));

        $ipFailures = $logModel->where('ip_address', $ip)
            ->where('action', 'login_failed')
            ->where('last_attempt >=', $oneMinuteAgo)
            ->countAllResults();

        $userFailures = $logModel->where('user_id', $user['id'])
            ->where('action', 'login_failed')
            ->where('last_attempt >=', $oneMinuteAgo)
            ->countAllResults();

        if ($ipFailures >= 5 || $userFailures >= 5) {
            // PERMANENT BLOCK USER
            $userModel->update($user['id'], [
                'is_blocked'     => 1,
                'blocked_reason' => 'Sistema Anti-Fraude: Fuerza bruta en Login (>5 intentos/min)'
            ]);

            // PERMANENT BLOCK IP
            $logModel->save([
                'ip_address' => $ip,
                'user_id'    => $user['id'],
                'action'     => 'auto_block',
                'details'    => 'IP y Usuario bloqueados por fuerza bruta (Login OTP)'
            ]);

            return $this->fail('Tu cuenta y acceso han sido bloqueados por seguridad debido a múltiples intentos fallidos.', 403);
        }

        return $this->fail('Código inválido o expirado.', 401);
    }

    public function login()
    {
        return $this->fail('Use OTP Login.', 400);
    }

    private function sendOtpEmail($email, $name, $otp)
    {
        $subject = 'Tu código de acceso - Takis Promo';
        $title   = 'Código de Acceso';
        $msg     = "<p>Hola <strong>{$name}</strong>,</p>
                <p>Tu código de verificación es:</p>
                <div style='font-size: 32px; font-weight: 800; color: #6C1DDA; background: #f4f4f4; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;'>$otp</div>
                <p>Úsalo para acceder. Expira en 10 minutos.</p>";

        EmailSender::sendEmail($email, $subject, $title, $msg, 'INGRESAR CÓDIGO');
    }
}
