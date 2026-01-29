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
        $user        = $userModel->find($userId);
        $pointsToAdd = $promo['points'] ?? 1; // Use points from promo code
        $newPoints   = ($user['points'] ?? 0) + $pointsToAdd;
        $userModel->update($userId, ['points' => $newPoints]);

        $logModel->save(['ip_address' => $ip, 'user_id' => $userId, 'action' => 'success_redeem', 'details' => "Code: $code, Points: $pointsToAdd"]);
        $db->transComplete();

        return $this->respond(['status' => 'success', 'message' => "¡Código Takis activado! +$pointsToAdd puntos", 'points' => $pointsToAdd, 'new_points' => $newPoints]);
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

        // Generar folio único ANTES de crear el registro
        $tempId     = time() . rand(1000, 9999);
        $uniqueCode = 'TKS-' . str_pad($tempId, 6, '0', STR_PAD_LEFT) . '-' . strtoupper(substr(md5($tempId), 0, 4));

        $redemptionData = [
            'user_id'      => $userId,
            'reward_id'    => $rewardId,
            'status'       => ($reward['type'] === 'digital') ? 'completed' : 'pending',
            'digital_code' => $uniqueCode, // Guardar el código único
        ];
        $redemptionModel->save($redemptionData);
        $redemptionId = $redemptionModel->insertID();

        // Actualizar con el ID real para el código
        $uniqueCode = 'TKS-' . str_pad($redemptionId, 6, '0', STR_PAD_LEFT) . '-' . strtoupper(substr(md5($redemptionId . time()), 0, 4));
        $redemptionModel->update($redemptionId, ['digital_code' => $uniqueCode]);

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

            // Correct path for templates
            $templatePath = FCPATH . 'uploads/templates/' . $reward['pdf_template'];

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

            // Parse code_areas format: "x,y,width,height,fontSize;x,y,width,height,fontSize"
            $codeAreas = $reward['code_areas'] ?? '';

            if (!empty($codeAreas)) {
                $areas = explode(';', $codeAreas);

                foreach ($areas as $areaStr) {
                    $areaStr = trim($areaStr);
                    if (empty($areaStr))
                        continue;

                    $parts = explode(',', $areaStr);
                    if (count($parts) >= 4) {
                        $xPct     = floatval($parts[0]);
                        $yPct     = floatval($parts[1]);
                        $wPct     = floatval($parts[2]);
                        $hPct     = floatval($parts[3]);
                        $fontSize = isset($parts[4]) ? intval($parts[4]) : 14;

                        // Convert percentages to template units
                        $x = ($xPct / 100) * $size['width'];
                        $y = ($yPct / 100) * $size['height'];
                        $w = ($wPct / 100) * $size['width'];
                        $h = ($hPct / 100) * $size['height'];

                        // Set font with configured size
                        $pdf->SetFont('Arial', 'B', $fontSize);
                        $pdf->SetTextColor(0, 0, 0);

                        // Position and write code
                        $pdf->SetXY($x, $y);

                        if ($w > 0 && $h > 0) {
                            // Use Cell for centered text in box
                            $pdf->Cell($w, $h, $code, 0, 0, 'C');
                        } else {
                            // Use Text for simple positioning
                            $pdf->Text($x, $y, $code);
                        }
                    }
                }
            } else {
                // Fallback: try old coordinates format
                $coords = json_decode($reward['coordinates'] ?? '[]', true);

                if (isset($coords['x']) && !isset($coords[0])) {
                    $coords = [$coords];
                }
                if (!is_array($coords))
                    $coords = [];

                $pdf->SetFont('Arial', 'B', 14);
                $pdf->SetTextColor(0, 0, 0);

                foreach ($coords as $box) {
                    $xPct = isset($box['x']) ? floatval($box['x']) : 50;
                    $yPct = isset($box['y']) ? floatval($box['y']) : 50;
                    $wPct = isset($box['w']) ? floatval($box['w']) : 0;
                    $hPct = isset($box['h']) ? floatval($box['h']) : 0;

                    $x = ($xPct / 100) * $size['width'];
                    $y = ($yPct / 100) * $size['height'];
                    $w = ($wPct / 100) * $size['width'];
                    $h = ($hPct / 100) * $size['height'];

                    $pdf->SetXY($x, $y);

                    if ($w > 0 && $h > 0) {
                        $pdf->Cell($w, $h, $code, 0, 0, 'C');
                    } else {
                        $pdf->Text($x, $y, $code);
                    }
                }
            }

            $pdf->Output($outputPath, 'F');
            return base_url('uploads/redeemed/' . $filename);

        } catch (\Exception $e) {
            log_message('error', 'PDF Generation Error: ' . $e->getMessage());
            return null;
        }
    }

    public function history()
    {
        $userId          = $this->request->user->id ?? $this->request->user->uid ?? null;
        $redemptionModel = new RedemptionModel();

        $history = $redemptionModel->select('redemptions.*, rewards.title as reward_title, rewards.image_url')
            ->join('rewards', 'rewards.id = redemptions.reward_id')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->findAll();

        return $this->respond($history);
    }

    public function codesHistory($userId = null)
    {
        $promoModel = new \App\Models\PromoCodeModel();
        $history    = $promoModel->where('used_by', $userId)
            ->orderBy('used_at', 'DESC')
            ->findAll();

        return $this->respond($history);
    }

    public function rewardsHistory($userId = null)
    {
        $redemptionModel = new \App\Models\RedemptionModel();
        $history         = $redemptionModel->select('redemptions.*, rewards.title, rewards.image_url, rewards.cost')
            ->join('rewards', 'rewards.id = redemptions.reward_id')
            ->where('user_id', $userId)
            ->orderBy('redemptions.created_at', 'DESC')
            ->findAll();

        return $this->respond($history);
    }
}
