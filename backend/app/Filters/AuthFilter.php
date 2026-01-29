<?php

namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;

class AuthFilter implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        $key        = 'kYiFLGycgRRp31CIOcwRASFw5e5JOqu6D/LKt+AaYlWMGAKlK/gYq9SlB1j9m2Bl/lqBs6l6fQaJat5riEtEPA==';
        $authHeader = $request->getServer('HTTP_AUTHORIZATION') ?? $request->getServer('REDIRECT_HTTP_AUTHORIZATION');

        if (!$authHeader && function_exists('apache_request_headers')) {
            $headers    = apache_request_headers();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
        }

        if (!$authHeader) {
            return Services::response()->setJSON(['message' => 'Token required'])->setStatusCode(401);
        }

        $token = preg_match('/Bearer\s(\S+)/', $authHeader, $matches) ? $matches[1] : $authHeader;

        try {
            // MANUAL BASE64 DECODE FOR COMPATIBILITY (If library fails)
            $parts = explode('.', $token);
            if (count($parts) !== 3)
                throw new \Exception("Invalid token format");

            $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])));
            if (!$payload)
                throw new \Exception("Invalid payload");

            // Verify signature using standard hash_hmac to bypass library issues
            $header    = $parts[0];
            $data      = "$parts[0].$parts[1]";
            $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[2]));

            $expectedSignature = hash_hmac('sha256', $data, $key, true);

            if (!hash_equals($signature, $expectedSignature)) {
                throw new \Exception("Invalid signature");
            }

            if (isset($payload->exp) && $payload->exp < time()) {
                throw new \Exception("Token expired");
            }

            $request->user = $payload;

            if (!isset($payload->role) || $payload->role !== 'system_admin') {
                $userModel = new \App\Models\UserModel();
                if (!$userModel->find($payload->id ?? $payload->uid ?? 0)) {
                    return Services::response()->setJSON(['message' => 'User not found'])->setStatusCode(401);
                }
            }

        } catch (\Exception $e) {
            return Services::response()->setJSON(['message' => 'Auth Error: ' . $e->getMessage()])->setStatusCode(401);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
    }
}
