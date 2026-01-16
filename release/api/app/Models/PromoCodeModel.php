<?php

namespace App\Models;

use CodeIgniter\Model;

class PromoCodeModel extends Model
{
    protected $table = 'promo_codes';
    protected $primaryKey = 'id';
    protected $allowedFields = ['code', 'points', 'is_used', 'used_by', 'used_at'];
    protected $useTimestamps = false;
}
