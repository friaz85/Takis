<?php

namespace App\Controllers;

use CodeIgniter\Controller;

class DebugController extends Controller
{
    public function index()
    {
        $db    = \Config\Database::connect();
        $query = $db->query("SELECT * FROM promo_codes");
        return $this->response->setJSON($query->getResultArray());
    }
}
