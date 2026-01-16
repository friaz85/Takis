<?php

namespace App\Controllers;

use App\Models\UserModel;
use CodeIgniter\RESTful\ResourceController;
use Firebase\JWT\JWT;
use App\Libraries\EmailSender;

class AuthController extends ResourceController
{
    private $key;

    public function __construct()
    {
        $this->key = getenv('JWT_SECRET') ?: 'takis_secret_key_123';
    }

    public function register()
    {
        $userModel = new UserModel();

        $rules = [
            'name'  => 'required|min_length[3]',
            'email' => 'required|valid_email',
            'phone' => 'required'
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $email     = $this->request->getVar('email');
        $otp       = rand(100000, 999999);
        $otpExpiry = date('Y-m-d H:i:s', strtotime('+10 minutes'));

        $randomPass = bin2hex(random_bytes(10));

        $existingUser = $userModel->where('email', $email)->first();

        // Prepare data mapping correctly to DB columns
        $data = [
            'full_name'   => $this->request->getVar('name'), // Map name -> full_name
            'email'       => $email,
            'phone'       => $this->request->getVar('phone'),
            'otp'         => $otp,
            'otp_expiry'  => $otpExpiry,
            'is_verified' => 0 // 0 = Pending
        ];

        if (!$existingUser) {
            // Only set password_hash for new users
            $data['password_hash'] = password_hash($randomPass, PASSWORD_BCRYPT);
        }

        if ($existingUser) {
            if ($existingUser['is_verified'] == 1) { // 1 = Active
                return $this->fail('Este correo ya está registrado y verificado. Por favor inicia sesión.', 400);
            } else {
                // Update existing unverified user
                $userModel->update($existingUser['id'], $data);
                $userId      = $existingUser['id'];
                $contactName = $existingUser['full_name'];
            }
        } else {
            $userId      = $userModel->insert($data);
            $contactName = $data['full_name'];

            if (!$userId) {
                // Debug: Return DB error if insert fails
                return $this->failServerError('Error writing to database.');
            }
        }

        // Send OTP
        $this->sendOtpEmail($email, $contactName ?? $data['full_name'], $otp);

        return $this->respondCreated(['status' => 'success', 'message' => 'Código enviado a tu correo.']);
    }

    public function requestLoginOtp()
    {
        $userModel = new UserModel();
        $email     = $this->request->getVar('email');

        $user = $userModel->where('email', $email)->first();

        if (!$user) {
            return $this->failNotFound('Correo no registrado. Regístrate primero.');
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
        $email     = $this->request->getVar('email');
        $otp       = $this->request->getVar('otp');

        $user = $userModel->where('email', $email)->first();

        if (!$user) {
            return $this->failNotFound('Usuario no encontrado.');
        }

        // Check if verified already? Maybe not, allow re-login via OTP anytime for Login flow

        if ($user['otp'] == $otp && strtotime($user['otp_expiry']) > time()) {

            // Mark Verified and Clear OTP
            $userModel->update($user['id'], ['is_verified' => 1, 'otp' => null, 'otp_expiry' => null]);

            $payload = [
                'iat'   => time(),
                'exp'   => time() + (60 * 60 * 24 * 30),
                'uid'   => $user['id'],
                'email' => $user['email']
            ];

            $token = JWT::encode($payload, $this->key, 'HS256');

            return $this->respond([
                'status'  => 'success',
                'message' => 'Código verificado.',
                'token'   => $token,
                'user'    => [
                    'id'     => $user['id'],
                    'name'   => $user['full_name'], // Map back for frontend consistency
                    'email'  => $user['email'],
                    'points' => $user['points'],
                    'role'   => $user['role'] ?? 'user'
                ]
            ]);
        }

        return $this->fail('Código inválido o expirado.', 401);
    }

    // Keep Login for Legacy/Admin compliance if needed, but Admin uses AdminAuthController usually.
    // However, if normal login endpoint is hit, check password_hash
    public function login()
    {
        $userModel = new UserModel();
        $email     = $this->request->getVar('email');
        $password  = $this->request->getVar('password');

        $user = $userModel->where('email', $email)->first();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            return $this->fail('Credenciales inválidas.', 401);
        }

        if ($user['is_verified'] != 1) {
            return $this->fail('Tu cuenta no ha sido verificada.', 403);
        }

        // ... Token generation ...
        return $this->fail('Use OTP Login for users.', 400); // Or implement token return.
    }

    private function sendOtpEmail($email, $name, $otp)
    {
        $subject = 'Tu código de acceso - Takis Promo';
        $title   = 'Código de Acceso';
        $msg     = "<p>Hola <strong>{$name}</strong>,</p>
                <p>Tu código de verificación es:</p>
                <div style='font-size: 32px; font-weight: 800; color: #F2E74B; letter-spacing: 5px; margin: 20px 0;'>$otp</div>
                <p>Úsalo para acceder. Expira en 10 minutos.</p>";

        EmailSender::sendEmail($email, $subject, $title, $msg, 'INGRESAR CÓDIGO');
    }
}
