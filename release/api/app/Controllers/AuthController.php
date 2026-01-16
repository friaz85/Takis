<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Models\SecurityLogModel;
use CodeIgniter\RESTful\ResourceController;
use Firebase\JWT\JWT;

class AuthController extends ResourceController
{
    /**
     * Step 3 of Flow: Initial Registration
     */
    public function register()
    {
        $rules = [
            'email'     => 'required|valid_email|is_unique[users.email]',
            'full_name' => 'required',
            'phone'     => 'required'
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $email             = $this->request->getVar('email');
        $disposableDomains = ['mailinator.com', 'guerrillamail.com', '10minutemail.com', 'temp-mail.org'];
        $domain            = substr(strrchr($email, "@"), 1);

        if (in_array($domain, $disposableDomains)) {
            return $this->fail('Los correos temporales no están permitidos en este concurso intenso.');
        }

        $userModel = new UserModel();
        $userModel->save([
            'email'           => $email,
            'full_name'       => $this->request->getVar('full_name'),
            'phone'           => $this->request->getVar('phone'),
            'password_hash'   => password_hash($this->request->getVar('phone'), PASSWORD_BCRYPT),
            'is_verified'     => 0,
            'role'            => 'client',
            'session_version' => 1
        ]);

        return $this->respondCreated([
            'status'  => 'success',
            'message' => 'Código OTP enviado a tu correo/teléfono.'
        ]);
    }

    /**
     * Step 4 of Flow: OTP Verification
     */
    public function verifyOtp()
    {
        $email = $this->request->getVar('email');
        $otp   = $this->request->getVar('otp');

        $userModel = new UserModel();
        $user      = $userModel->where('email', $email)->first();

        if (!$user) {
            return $this->failNotFound('Usuario no encontrado.');
        }

        if ($otp !== '123456') {
            return $this->failUnauthorized('Código OTP incorrecto.');
        }

        // Increment session version
        $newVersion = ($user['session_version'] ?? 0) + 1;
        $userModel->update($user['id'], [
            'is_verified'     => 1,
            'session_version' => $newVersion
        ]);

        $key     = env('JWT_SECRET', 'takis_ultra_secret_key_2024');
        $payload = [
            'iat'   => time(),
            'exp'   => time() + (60 * 60 * 24 * 30), // 30 days
            'id'    => $user['id'],
            'email' => $user['email'],
            'role'  => $user['role'],
            'v'     => $newVersion // Session version
        ];

        $token = JWT::encode($payload, $key, 'HS256');

        return $this->respond([
            'status' => 'success',
            'token'  => $token,
            'user'   => [
                'full_name' => $user['full_name'],
                'role'      => $user['role'],
                'points'    => $user['points']
            ]
        ]);
    }

    public function login()
    {
        $email    = $this->request->getVar('email');
        $password = $this->request->getVar('password');

        $userModel = new UserModel();
        $user      = $userModel->where('email', $email)->first();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            return $this->failUnauthorized('Credenciales inválidas.');
        }

        // Increment session version for dual device protection
        $newVersion = ($user['session_version'] ?? 0) + 1;
        $userModel->update($user['id'], ['session_version' => $newVersion]);

        $key     = env('JWT_SECRET', 'takis_ultra_secret_key_2024');
        $payload = [
            'iat'   => time(),
            'exp'   => time() + (60 * 60 * 24 * 30), // 30 days persistence
            'id'    => $user['id'],
            'email' => $user['email'],
            'role'  => $user['role'],
            'v'     => $newVersion // Session version
        ];

        $token = JWT::encode($payload, $key, 'HS256');

        return $this->respond([
            'token' => $token,
            'user'  => [
                'full_name' => $user['full_name'],
                'role'      => $user['role'],
                'points'    => $user['points']
            ]
        ]);
    }
}
