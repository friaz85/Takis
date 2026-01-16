<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Config\Services;

class AuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $key    = env('JWT_SECRET', 'takis_ultra_secret_key_2024');
        $header = $request->getServer('HTTP_AUTHORIZATION');

        if (!$header) {
            return Services::response()
                ->setJSON(['message' => 'Token required'])
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
        }

        $token = explode(' ', $header)[1] ?? '';

        try {
            $decoded = JWT::decode($token, new Key($key, 'HS256'));

            // Session Concurrency Check
            $userModel = new \App\Models\UserModel();
            $user      = $userModel->find($decoded->id);

            if (!$user || (isset($decoded->v) && $decoded->v != $user['session_version'])) {
                return Services::response()
                    ->setJSON(['message' => 'Sesión expirada o iniciada en otro dispositivo'])
                    ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
            }

            // Check role if arguments passed
            if ($arguments && !in_array($decoded->role, $arguments)) {
                return Services::response()
                    ->setJSON(['message' => 'Forbidden'])
                    ->setStatusCode(ResponseInterface::HTTP_FORBIDDEN);
            }
            // Pass user data to request
            $request->user = $decoded;
        } catch (\Exception $e) {
            return Services::response()
                ->setJSON(['message' => 'Invalid token'])
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        // ...
    }
}
