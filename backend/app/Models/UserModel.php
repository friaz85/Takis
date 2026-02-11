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
        'recipient_name',
        'phone',
        'is_verified',
        'role',
        'points',
        'address',
        'colonia',
        'municipio',
        'city',
        'state',
        'zip_code',
        'delivery_instructions',
        'session_version',
        'otp',
        'otp_expiry',
        'is_blocked',
        'blocked_reason',
        'blocked_at'
    ];
    protected $useTimestamps = true;

    // Auto map password to password_hash if needed, but better to be explicit in controller
}
