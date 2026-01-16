<?php

namespace App\Models;

use CodeIgniter\Model;

class SecurityLogModel extends Model
{
    protected $table = 'security_logs';
    protected $primaryKey = 'id';
    protected $allowedFields = ['ip_address', 'user_id', 'action', 'details'];
}
