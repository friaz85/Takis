<?php

namespace App\Controllers;

use App\Models\AdminUserModel;
use CodeIgniter\RESTful\ResourceController;
use Firebase\JWT\JWT;
use Config\Services;

class AdminAuthController extends ResourceController
{
    protected $modelName = 'App\Models\AdminUserModel';
    protected $format = 'json';

    public function login()
    {
        $rules = [
            'username' => 'required',
            'password' => 'required|min_length[8]'
        ];

        if (!$this->validate($rules)) {
            return $this->fail($this->validator->getErrors());
        }

        $username = $this->request->getVar('username');
        $password = $this->request->getVar('password');

        $adminModel = new AdminUserModel();
        $admin      = $adminModel->where('username', $username)->first();

        if (!$admin || !password_verify($password, $admin['password_hash'])) {
            return $this->failUnauthorized('Credenciales inválidas');
        }

        $key     = env('JWT_SECRET', 'takis_ultra_secret_key_2024');
        $payload = [
            'iss'      => 'TakisPromo',
            'aud'      => 'TakisPromo',
            'iat'      => time(),
            'nbf'      => time(),
            'exp'      => time() + (60 * 60 * 8), // 8 hours
            'id'       => $admin['id'],
            'username' => $admin['username'],
            'email'    => $admin['email'],
            'role'     => 'system_admin'
        ];

        $token = JWT::encode($payload, $key, 'HS256');

        return $this->respond([
            'message' => 'Login exitoso',
            'token'   => $token,
            'user'    => [
                'id'       => $admin['id'],
                'username' => $admin['username'],
                'email'    => $admin['email'],
                'role'     => 'system_admin'
            ]
        ]);
    }
}
