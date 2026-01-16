<?php

namespace App\Models;

use CodeIgniter\Model;

class RewardCodeModel extends Model
{
    protected $table = 'reward_codes';
    protected $primaryKey = 'id';
    protected $allowedFields = ['reward_id', 'code', 'is_used'];
    protected $useTimestamps = true;
}
