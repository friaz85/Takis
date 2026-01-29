<?php

namespace App\Controllers;

use App\Models\UserModel;
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

        $rules = [
            'name'  => 'required',
            'email' => 'required|valid_email',
            'phone' => 'required'
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $email     = $this->request->getVar('email');
        $otp       = rand(100000, 999999);
        $otpExpiry = date('Y-m-d H:i:s', strtotime('+10 minutes'));

        $existingUser = $userModel->where('email', $email)->first();

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

        if ($user['otp'] == $otp && strtotime($user['otp_expiry']) > time()) {

            $userModel->update($user['id'], ['is_verified' => 1, 'otp' => null, 'otp_expiry' => null]);

            $payload = [
                'iat'   => time(),
                'exp'   => time() + (60 * 60 * 24 * 30),
                'id'    => $user['id'], // <--- CHANGED FROM uid TO id
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
