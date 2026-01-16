<?php

namespace App\Controllers;

use App\Models\PromoCodeModel;
use App\Models\UserModel;
use App\Models\RewardModel;
use App\Models\RedemptionModel;
use App\Models\SecurityLogModel;
use CodeIgniter\RESTful\ResourceController;
use setasign\Fpdi\Fpdi;

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

        // Generar folio único
        $uniqueCode = 'TKS-' . str_pad($redemptionId, 6, '0', STR_PAD_LEFT) . '-' . strtoupper(substr(md5(time()), 0, 4));

        $pdfUrl = null;
        if ($reward['type'] === 'digital') {
            $pdfUrl = $this->generateAndSavePdf($user, $reward, $redemptionId, $uniqueCode);
        }

        $db->transComplete();
        return $this->respond(['status' => 'success', 'message' => '¡Canje exitoso!', 'pdf_url' => $pdfUrl, 'code' => $uniqueCode]);
    }

    private function generateAndSavePdf($user, $reward, $redemptionId, $code)
    {
        try {
            if (empty($reward['pdf_template']))
                return null;

            $templatePath = FCPATH . 'uploads/pdfs/' . $reward['pdf_template'];

            if (!file_exists($templatePath)) {
                log_message('error', 'PDF Template not found: ' . $templatePath);
                return null;
            }

            $filename   = 'takis_reward_' . $redemptionId . '_' . time() . '.pdf';
            $outputPath = FCPATH . 'uploads/redeemed/' . $filename;

            if (!is_dir(dirname($outputPath)))
                mkdir(dirname($outputPath), 0777, true);

            $pdf       = new Fpdi();
            $pageCount = $pdf->setSourceFile($templatePath);
            $tplIdx    = $pdf->importPage(1);
            $size      = $pdf->getTemplateSize($tplIdx);

            $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
            $pdf->useTemplate($tplIdx);

            $pdf->SetFont('Arial', 'B', 14);
            $pdf->SetTextColor(0, 0, 0);

            $coords = json_decode($reward['coordinates'], true);

            // Backwards compatibility for single coordinate object
            if (isset($coords['x']) && !isset($coords[0])) {
                $coords = [$coords];
            }
            if (!is_array($coords))
                $coords = [];

            foreach ($coords as $box) {
                // Default percentages if missing
                $xPct = isset($box['x']) ? floatval($box['x']) : 50;
                $yPct = isset($box['y']) ? floatval($box['y']) : 50;
                $wPct = isset($box['w']) ? floatval($box['w']) : 0;
                $hPct = isset($box['h']) ? floatval($box['h']) : 0;

                // Convert % to mm
                $x = ($xPct / 100) * $size['width'];
                $y = ($yPct / 100) * $size['height'];
                $w = ($wPct / 100) * $size['width'];
                $h = ($hPct / 100) * $size['height'];

                $pdf->SetXY($x, $y);

                if ($w > 0 && $h > 0) {
                    // Si tiene dimensiones definidas, centrar en la caja
                    // Cell(w, h, txt, border, ln, align)
                    $pdf->Cell($w, $h, $code, 0, 0, 'C');
                } else {
                    // Si no, escribir simplemente en la posición
                    $pdf->Text($x, $y, $code);
                }
            }

            $pdf->Output($outputPath, 'F');
            return base_url('uploads/redeemed/' . $filename);

        } catch (\Exception $e) {
            log_message('error', 'PDF Generation Error: ' . $e->getMessage());
            return null;
        }
    }
}
