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
        // Filter out items with no stock as per user preference
        return $this->respond($rewardModel->where('active', 1)->where('stock >', 0)->findAll());
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
            'image_url'    => !empty($data['image_url']) ? $data['image_url'] : null,
            'pdf_template' => !empty($data['pdf_template']) ? $data['pdf_template'] : null,
            'coordinates'  => !empty($data['coordinates']) ? $data['coordinates'] : null,
            'code_areas'   => !empty($data['code_areas']) ? $data['code_areas'] : null,
            'font_size'    => $data['font_size'] ?? 12,
        ];

        // Debug log
        log_message('error', 'Attempting to create reward with data: ' . json_encode($saveData));

        if ($rewardModel->insert($saveData)) {
            $rewardId = $rewardModel->insertID();
            return $this->respondCreated(['message' => 'Recompensa creada', 'id' => $rewardId]);
        }

        log_message('error', 'Create Reward Failed: ' . json_encode($rewardModel->errors()));
        return $this->fail($rewardModel->errors());
    }

    public function updateReward($id = null)
    {
        $rewardModel = new RewardModel();
        $data        = $this->request->getJSON(true) ?? $this->request->getVar();

        // Sanitize data for update
        $updateData = [];
        if (isset($data['title']))
            $updateData['title'] = $data['title'];
        if (isset($data['description']))
            $updateData['description'] = $data['description'];
        if (isset($data['type']))
            $updateData['type'] = $data['type'];
        if (isset($data['cost']))
            $updateData['cost'] = $data['cost'];
        if (isset($data['stock']))
            $updateData['stock'] = $data['stock'];
        if (isset($data['active']))
            $updateData['active'] = $data['active'];
        if (key_exists('image_url', $data))
            $updateData['image_url'] = !empty($data['image_url']) ? $data['image_url'] : null;
        if (key_exists('pdf_template', $data))
            $updateData['pdf_template'] = !empty($data['pdf_template']) ? $data['pdf_template'] : null;
        if (key_exists('coordinates', $data))
            $updateData['coordinates'] = !empty($data['coordinates']) ? $data['coordinates'] : null;
        if (key_exists('code_areas', $data))
            $updateData['code_areas'] = !empty($data['code_areas']) ? $data['code_areas'] : null;
        if (isset($data['font_size']))
            $updateData['font_size'] = $data['font_size'];

        if ($rewardModel->update($id, $updateData)) {
            return $this->respond(['message' => 'Recompensa actualizada']);
        }

        log_message('error', 'Update Reward Failed: ' . json_encode($rewardModel->errors()));
        return $this->fail($rewardModel->errors());
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
        return $this->respond($rewardModel->orderBy('cost', 'ASC')->findAll());
    }
}
