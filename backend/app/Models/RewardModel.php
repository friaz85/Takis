<?php

namespace App\Models;

use CodeIgniter\Model;

class RewardModel extends Model
{
    protected $table = 'rewards';
    protected $primaryKey = 'id';
    protected $allowedFields = [
        'title',
        'description',
        'type',
        'cost',
        'stock',
        'active',
        'image_url',
        'pdf_template',
        'coordinates',
        'code_areas',
        'font_size'
    ];
    protected $useTimestamps = true;
}
