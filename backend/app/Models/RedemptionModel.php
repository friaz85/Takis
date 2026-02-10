<?php

namespace App\Models;

use CodeIgniter\Model;

class RedemptionModel extends Model
{
    protected $table = 'redemptions';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'user_id',
        'reward_id',
        'status',
        'shipping_details',
        'digital_code',
        'pdf_path',
        'admin_notes',
        'tracking_number',
        'tracking_url',
        'delivery_date',
        'recipient_name'
    ];
    protected $useTimestamps = true;
    protected $updatedField = '';
}
