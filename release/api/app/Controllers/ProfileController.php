<?php

namespace App\Controllers;

use App\Models\UserModel;
use CodeIgniter\RESTful\ResourceController;

class ProfileController extends ResourceController
{
    public function getProfile()
    {
        $userId    = $this->request->user->id;
        $userModel = new UserModel();
        $user      = $userModel->find($userId);

        if (!$user) {
            return $this->failNotFound('Usuario no encontrado');
        }

        // Remove sensitive data
        unset($user['password_hash']);

        return $this->respond($user);
    }

    public function updateProfile()
    {
        $userId    = $this->request->user->id;
        $userModel = new UserModel();

        $data = [
            'full_name' => $this->request->getVar('full_name'),
            'address'   => $this->request->getVar('address'),
            'city'      => $this->request->getVar('city'),
            'state'     => $this->request->getVar('state'),
            'zip_code'  => $this->request->getVar('zip_code'),
            'phone'     => $this->request->getVar('phone')
        ];

        // Clean null values
        $data = array_filter($data, fn($value) => !is_null($value));

        if ($userModel->update($userId, $data)) {
            return $this->respond(['message' => 'Perfil actualizado correctamente']);
        }

        return $this->fail('No se pudo actualizar el perfil');
    }
}
