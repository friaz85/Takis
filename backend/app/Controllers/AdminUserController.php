<?php

namespace App\Controllers;

use App\Models\UserModel;
use CodeIgniter\RESTful\ResourceController;

class AdminUserController extends ResourceController
{
    protected $modelName = 'App\Models\UserModel';
    protected $format = 'json';

    public function index()
    {
        try {
            $users = $this->model->select('id, full_name, email, phone, points, is_verified, created_at')
                ->orderBy('created_at', 'DESC')
                ->findAll();

            return $this->respond($users);
        } catch (\Exception $e) {
            return $this->failServerError($e->getMessage());
        }
    }
}
