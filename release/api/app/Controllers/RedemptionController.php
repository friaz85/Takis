<?php

namespace App\Controllers;

use App\Models\PromoCodeModel;
use App\Models\UserModel;
use App\Models\RewardModel;
use App\Models\RedemptionModel;
use App\Models\SecurityLogModel;
use CodeIgniter\RESTful\ResourceController;

class RedemptionController extends ResourceController
{
    public function redeemCode()
    {
        $db         = \Config\Database::connect();
        $promoModel = new PromoCodeModel();
        $userModel  = new UserModel();
        $logModel   = new SecurityLogModel();

        $ip     = $this->request->getIPAddress();
        $userId = $this->request->user->id;
        $code   = $this->request->getVar('code');

        $attempts = $logModel->where('ip_address', $ip)
            ->where('action', 'failed_redeem')
            ->where('created_at >=', date('Y-m-d 00:00:00'))
            ->countAllResults();

        if ($attempts > 20) {
            return $this->fail('Demasiados intentos fallidos.', 429);
        }

        $db->transStart();

        $promo = $promoModel->where('code', $code)->where('is_used', 0)->first();

        if (!$promo) {
            $logModel->save(['ip_address' => $ip, 'user_id' => $userId, 'action' => 'failed_redeem', 'details' => "Code: $code"]);
            $db->transRollback();
            return $this->failNotFound('Código inválido o ya utilizado.');
        }

        $promoModel->update($promo['id'], ['is_used' => 1, 'used_by' => $userId, 'used_at' => date('Y-m-d H:i:s')]);
        $user      = $userModel->find($userId);
        $newPoints = ($user['points'] ?? 0) + 1;
        $userModel->update($userId, ['points' => $newPoints]);

        $logModel->save(['ip_address' => $ip, 'user_id' => $userId, 'action' => 'success_redeem', 'details' => "Code: $code"]);
        $db->transComplete();

        return $this->respond(['status' => 'success', 'message' => '¡Código Takis activado!', 'new_points' => $newPoints]);
    }

    public function redeemReward()
    {
        $db              = \Config\Database::connect();
        $userModel       = new UserModel();
        $rewardModel     = new RewardModel();
        $redemptionModel = new RedemptionModel();

        $userId   = $this->request->user->id;
        $rewardId = $this->request->getVar('reward_id');

        $user   = $userModel->find($userId);
        $reward = $rewardModel->find($rewardId);

        if (!$reward || $reward['stock'] <= 0) {
            return $this->fail('Recompensa no disponible.');
        }

        if ($user['points'] < $reward['cost']) {
            return $this->fail('Puntos insuficientes.');
        }

        $db->transStart();
        $userModel->update($userId, ['points' => $user['points'] - $reward['cost']]);
        $rewardModel->update($rewardId, ['stock' => $reward['stock'] - 1]);

        $redemptionData = [
            'user_id'   => $userId,
            'reward_id' => $rewardId,
            'status'    => ($reward['type'] === 'digital') ? 'completed' : 'pending',
        ];
        $redemptionModel->save($redemptionData);
        $redemptionId = $redemptionModel->insertID();

        $pdfUrl = null;
        if ($reward['type'] === 'digital') {
            $pdfUrl = $this->generateAndSavePdf($user, $reward, $redemptionId);
        }

        $db->transComplete();
        return $this->respond(['status' => 'success', 'message' => '¡Canje exitoso!', 'pdf_url' => $pdfUrl]);
    }

    private function generateAndSavePdf($user, $reward, $redemptionId)
    {
        $filename = 'takis_reward_' . $redemptionId . '_' . time() . '.pdf';
        $path     = WRITEPATH . 'uploads/redeemed/' . $filename;
        if (!is_dir(WRITEPATH . 'uploads/redeemed'))
            mkdir(WRITEPATH . 'uploads/redeemed', 0777, true);
        file_put_contents($path, "%PDF-1.4\n% MOCK PDF CONTENT FOR TAKIS REWARD " . $redemptionId);
        return base_url('api/download-reward/' . $redemptionId);
    }
}
