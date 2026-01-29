<?php

namespace App\Controllers;

use App\Models\RewardModel;
use App\Models\RewardCodeModel;
use CodeIgniter\RESTful\ResourceController;

class RewardAdminController extends ResourceController
{
    public function index()
    {
        $rewardModel = new RewardModel();
        return $this->respond($rewardModel->findAll());
    }

    public function publicCatalog()
    {
        $rewardModel = new RewardModel();
        return $this->respond($rewardModel->where('active', 1)->findAll());
    }

    public function createReward()
    {
        $rewardModel = new RewardModel();
        $data        = $this->request->getJSON(true) ?? $this->request->getVar();

        $saveData = [
            'title'        => $data['title'] ?? null,
            'description'  => $data['description'] ?? null,
            'type'         => $data['type'] ?? 'physical',
            'cost'         => $data['cost'] ?? 0,
            'stock'        => $data['stock'] ?? 0,
            'active'       => $data['active'] ?? 1,
            'image_url'    => $data['image_url'] ?? null,
            'pdf_template' => $data['pdf_template'] ?? null,
            'coordinates'  => $data['coordinates'] ?? null,
            'code_areas'   => $data['code_areas'] ?? $data['coordinates'] ?? null,
            'font_size'    => $data['font_size'] ?? 12,
        ];

        if ($rewardModel->insert($saveData)) {
            $rewardId = $rewardModel->insertID();
            return $this->respondCreated(['message' => 'Recompensa creada', 'id' => $rewardId]);
        }

        return $this->fail('Error al crear la recompensa');
    }

    public function updateReward($id = null)
    {
        $rewardModel = new RewardModel();
        $data        = $this->request->getJSON(true) ?? $this->request->getVar();

        // Ensure some fields are handled if they come in coordinates vs code_areas
        if (isset($data['coordinates']) && !isset($data['code_areas'])) {
            $data['code_areas'] = $data['coordinates'];
        }

        if ($rewardModel->update($id, $data)) {
            return $this->respond(['message' => 'Recompensa actualizada']);
        }
        return $this->fail('Error al actualizar');
    }

    public function deleteReward($id = null)
    {
        $rewardModel = new RewardModel();
        if ($rewardModel->delete($id)) {
            return $this->respondDeleted(['message' => 'Recompensa eliminada']);
        }
        return $this->fail('Error al eliminar');
    }

    public function addCodes($rewardId)
    {
        $codes           = $this->request->getVar('codes');
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
