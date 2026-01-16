<?php

namespace App\Models;

use CodeIgniter\Model;

class RedemptionModel extends Model
{
    protected $table = 'redemptions';
    protected $primaryKey = 'id';
    protected $allowedFields = ['user_id', 'reward_id', 'status', 'shipping_address', 'digital_code'];
    protected $useTimestamps = true;
    protected $updatedField = '';
}
