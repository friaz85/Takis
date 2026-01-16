<?php

namespace App\Models;

use CodeIgniter\Model;

class UserModel extends Model
{
    protected $table = 'users';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'email',
        'password_hash',
        'full_name',
        'phone',
        'is_verified',
        'role',
        'points',
        'address',
        'city',
        'state',
        'zip_code',
        'session_version',
        'otp',        // NEW
        'otp_expiry'  // NEW
    ];
    protected $useTimestamps = true;

    // Auto map password to password_hash if needed, but better to be explicit in controller
}
