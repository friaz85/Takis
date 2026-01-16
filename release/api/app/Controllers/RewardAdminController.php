<?php

namespace App\Controllers;

use App\Models\RewardModel;
use App\Models\RewardCodeModel;
use CodeIgniter\RESTful\ResourceController;

class RewardAdminController extends ResourceController
{
    public function createReward()
    {
        $rewardModel = new RewardModel();

        $data = [
            'title'        => $this->request->getVar('title'),
            'description'  => $this->request->getVar('description'),
            'type'         => $this->request->getVar('type'),
            'cost'         => $this->request->getVar('cost'),
            'stock'        => $this->request->getVar('stock'),
            'image_url'    => $this->request->getVar('image_url'),
            'pdf_template' => $this->request->getVar('pdf_template'),
            'coordinates'  => $this->request->getVar('coordinates'), // JSON string
            'font_size'    => $this->request->getVar('font_size'),
        ];

        if ($rewardModel->save($data)) {
            $rewardId = $rewardModel->insertID();
            return $this->respondCreated(['message' => 'Recompensa creada', 'id' => $rewardId]);
        }

        return $this->fail('Error al crear la recompensa');
    }

    public function addCodes($rewardId)
    {
        $codes           = $this->request->getVar('codes'); // Array of strings
        $rewardCodeModel = new RewardCodeModel();

        foreach ($codes as $code) {
            $rewardCodeModel->save([
                'reward_id' => $rewardId,
                'code'      => $code,
                'is_used'   => false
            ]);
        }

        return $this->respondCreated(['message' => 'Códigos agregados exitosamente']);
    }

    public function getRewards()
    {
        $rewardModel = new RewardModel();
        return $this->respond($rewardModel->findAll());
    }
}
