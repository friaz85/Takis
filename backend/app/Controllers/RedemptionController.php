<?php

namespace App\Controllers;

use App\Models\PromoCodeModel;
use App\Models\UserModel;
use App\Models\RewardModel;
use App\Models\RewardCodeModel;
use App\Models\RedemptionModel;
use App\Models\SecurityLogModel;
use CodeIgniter\RESTful\ResourceController;
use setasign\Fpdi\Fpdi;
use App\Libraries\EmailSender;

class RedemptionController extends ResourceController
{
    public function redeemCode()
    {
        $db         = \Config\Database::connect();
        $promoModel = new PromoCodeModel();
        $userModel  = new UserModel();
        $logModel   = new SecurityLogModel();

        $ip     = $this->request->getIPAddress();
        $userId = $this->request->user->id ?? $this->request->user->uid;
        $code   = $this->request->getVar('code');

        // Verify if user is blocked
        $currentUser = $userModel->find($userId);
        if ($currentUser && isset($currentUser['is_blocked']) && (int) $currentUser['is_blocked'] === 1) {
            return $this->fail('Tu cuenta ha sido bloqueada. No puedes realizar esta accion.', 403);
        }

        /*
         * Rate limiting to prevent bruteforce:
         * - Per User: Max 20 failed attempts per day
         * - Per IP: Max 60 failed attempts per day
         */
        $today = date('Y-m-d 00:00:00');

        // Check User attempts (failed)
        $userAttempts = $logModel->where('user_id', $userId)
            ->where('action', 'failed_redeem')
            ->where('last_attempt >=', $today)
            ->countAllResults();

        if ($userAttempts >= 20) {
            return $this->fail('Demasiados intentos fallidos. Intenta más tarde.', 429);
        }

        // Check IP attempts (failed)
        $ipAttempts = $logModel->where('ip_address', $ip)
            ->where('action', 'failed_redeem')
            ->where('last_attempt >=', $today)
            ->countAllResults();

        if ($ipAttempts >= 60) {
            return $this->fail('Se ha alcanzado el límite de intentos desde esta dirección IP. Intenta más tarde.', 429);
        }

        // Check Daily Limits (Successful redemptions)

        // 1. Per User: Max 20
        $userDailyCount = $promoModel->where('used_by', $userId)
            ->where('used_at >=', $today)
            ->countAllResults();

        if ($userDailyCount >= 20) {
            return $this->fail('Has alcanzado el límite de 20 códigos canjeados por día.', 429);
        }

        // 2. Per IP: Max 60
        $ipDailyCount = $promoModel->where('used_ip', $ip)
            ->where('used_at >=', $today)
            ->countAllResults();

        if ($ipDailyCount >= 60) {
            return $this->fail('Se ha alcanzado el límite de códigos canjeados desde esta dirección IP por hoy.', 429);
        }

        // Ensure we select points explicitly to be safe, though findAll/first should return all
        // First check if code exists at all
        $promo = $promoModel->where('code', $code)->first();

        if (!$promo) {
            // Log BEFORE starting transaction so it persists
            $logModel->save(['ip_address' => $ip, 'user_id' => $userId, 'action' => 'failed_redeem', 'details' => 'Invalid Code: ' . $code]);
            return $this->failNotFound('Código inválido. Verifica que esté escrito correctamente.');
        }

        if ($promo['is_used'] == 1) {
            // Log BEFORE starting transaction so it persists
            $logModel->save(['ip_address' => $ip, 'user_id' => $userId, 'action' => 'failed_redeem', 'details' => 'Code Already Used: ' . $code]);
            return $this->fail('Este código ya ha sido utilizado anteriormente.', 400);
        }

        $db->transStart();

        log_message('error', 'Redeeming Code Data: ' . print_r($promo, true));

        $pointsToAdd = isset($promo['points']) ? intval($promo['points']) : 0;

        // If points is 0 and fallback was triggered, something is wrong with data structure
        if ($pointsToAdd === 0 && (!isset($promo['points']) || $promo['points'] === null)) {
            // Try to investigate or fallback to 1 if that was intended behavior (but user said it's wrong)
            log_message('error', 'Points column missing or null on code: ' . $code);
            // Verify if maybe field is 'Points' or something else? No, schema is lowercase.
        }

        $promoModel->update($promo['id'], [
            'is_used' => 1,
            'used_by' => $userId,
            'used_at' => date('Y-m-d H:i:s'),
            'used_ip' => $ip // Saving IP
        ]);

        $user      = $userModel->find($userId);
        $newPoints = ($user['points'] ?? 0) + $pointsToAdd;
        $userModel->update($userId, ['points' => $newPoints]);

        $logModel->save(['ip_address' => $ip, 'user_id' => $userId, 'action' => 'success_redeem', 'details' => 'Code Redeemed: ' . $code]);
        $db->transComplete();

        return $this->respond([
            'status'     => 'success',
            'message'    => "¡Código Takis activado! +$pointsToAdd puntos",
            'points'     => $pointsToAdd,
            'new_points' => $newPoints
        ]);
    }

    public function redeemReward()
    {
        $db              = \Config\Database::connect();
        $userModel       = new UserModel();
        $rewardModel     = new RewardModel();
        $rewardCodeModel = new RewardCodeModel();
        $redemptionModel = new RedemptionModel();
        $logModel        = new SecurityLogModel();

        $userId   = $this->request->user->id;
        $rewardId = $this->request->getVar('reward_id');

        $user = $userModel->find($userId);

        // Verify if user is blocked
        if ($user && isset($user['is_blocked']) && (int) $user['is_blocked'] === 1) {
            return $this->fail('Tu cuenta ha sido bloqueada. No puedes realizar esta accion.', 403);
        }

        $reward = $rewardModel->find($rewardId);

        if (!$reward || $reward['stock'] <= 0) {
            return $this->fail('Recompensa no disponible (Stock agotado).');
        }

        if ($user['points'] < $reward['cost']) {
            return $this->fail('Puntos insuficientes.');
        }

        // Validate Profile Data (Shipping Info) if reward is physical
        if ($reward['type'] === 'physical') {
            if (empty($user['address']) || empty($user['city']) || empty($user['state']) || empty($user['zip_code']) || empty($user['phone'])) {
                // Return specific code so frontend can redirect
                return $this->fail('Por favor completa tus datos de envío en tu perfil para canjear este premio físico.', 400, 'PROFILE_INCOMPLETE');
            }
        }

        // --- Determine number of codes needed ---
        $codeAreasStr = $reward['code_areas'] ?? '';
        $areas        = array_filter(explode(';', $codeAreasStr));
        $neededCount  = count($areas) > 0 ? count($areas) : 1;

        // --- Strategy: Inventory (Pre-loaded) vs Generated ---
        $hasInventory = $rewardCodeModel->where('reward_id', $rewardId)->countAllResults() > 0;
        $codesList    = [];

        $db->transStart();

        if ($hasInventory) {
            // It is an Inventory Reward. We MUST have enough codes.
            $availableCodes = $rewardCodeModel->where('reward_id', $rewardId)
                ->where('is_used', 0)
                ->limit($neededCount)
                ->find();

            if (count($availableCodes) < $neededCount) {
                $db->transRollback();
                return $this->fail('Lo sentimos, no hay suficientes códigos disponibles para esta recompensa en este momento.');
            }

            foreach ($availableCodes as $c) {
                // Mark as used
                $rewardCodeModel->update($c['id'], ['is_used' => 1]);
                $codesList[] = $c['code'];
            }
        } else {
            // It is a Generated Reward. Generate unique IDs.
            for ($i = 0; $i < $neededCount; $i++) {
                $tempId        = time() . rand(1000, 9999) . $i;
                $generatedCode = 'TKS-' . str_pad($userId . rand(0, 99), 6, '0', STR_PAD_LEFT) . '-' . strtoupper(substr(md5($tempId), 0, 4));
                $codesList[]   = $generatedCode;
            }
        }

        // Deduct Points and Stock
        $userUpdate   = $userModel->update($userId, ['points' => $user['points'] - $reward['cost']]);
        $newStock     = $reward['stock'] - 1;
        $rewardUpdate = $rewardModel->update($rewardId, ['stock' => $newStock]);

        if (!$userUpdate || !$rewardUpdate) {
            log_message('error', 'Update Failed during redemption. User: ' . $userId);
        }

        // Check for low stock and send WhatsApp alert
        if ($reward['type'] === 'digital' && $newStock < 10 && $newStock > 0) {
            try {
                \App\Libraries\WhatsAppNotifier::sendLowStockAlert($reward['title'], $newStock);
            } catch (\Exception $e) {
                log_message('error', 'WhatsApp low stock notification failed: ' . $e->getMessage());
            }
        }

        $finalCodeString = implode(',', $codesList);

        // Prepare shipping details if physical
        $shippingDetails = null;
        if ($reward['type'] === 'physical') {
            $shippingDetails = json_encode([
                'address'   => $user['address'],
                'colonia'   => $user['colonia'] ?? '',
                'municipio' => $user['municipio'] ?? '',
                'city'      => $user['city'],
                'state'     => $user['state'],
                'zip_code'  => $user['zip_code'],
                'phone'     => $user['phone']
            ]);
        }

        $redemptionData = [
            'user_id'          => $userId,
            'reward_id'        => $rewardId,
            'status'           => ($reward['type'] === 'digital') ? 'completed' : 'pending',
            'digital_code'     => $finalCodeString,
            'shipping_details' => $shippingDetails
        ];
        $redemptionModel->save($redemptionData);
        $redemptionId = $redemptionModel->insertID();

        // Generate PDF or handle wallpaper
        $pdfUrl      = null;
        $isWallpaper = false;

        if ($reward['type'] === 'digital') {
            // Check extension of pdf_template to see if it's actually an image (Wallpaper moved to template field)
            $templateExt     = pathinfo($reward['pdf_template'] ?? '', PATHINFO_EXTENSION);
            $isImageTemplate = in_array(strtolower($templateExt), ['jpg', 'jpeg', 'png']);

            // Case 1: Wallpaper defined via Image URL only (legacy/simple mode) OR Image uploaded as template
            if ((empty($reward['pdf_template']) && !empty($reward['image_url'])) || $isImageTemplate) {

                // Determine source file
                $sourceFile = $isImageTemplate ? $reward['pdf_template'] : $reward['image_url'];
                $sourcePath = $isImageTemplate ? 'uploads/templates/' : 'uploads/rewards/';

                $isWallpaper = true;
                $pdfUrl      = base_url($sourcePath . $sourceFile);

                // Save the filename as pdf_path
                $redemptionModel->update($redemptionId, ['pdf_path' => $sourceFile]);
            } else {
                // Regular digital reward with PDF Template
                $pdfUrl = $this->generateAndSavePdf($user, $reward, $redemptionId, $codesList); // Pass array

                // Update redemption with PDF path if successful
                if ($pdfUrl) {
                    // Extract relative path or filename if needed, but saving specific path or just url logic
                    // For DB 'pdf_path', let's save the filename relative to 'uploads/redeemed/'
                    $filename = basename($pdfUrl);
                    $redemptionModel->update($redemptionId, ['pdf_path' => $filename]);
                }
            }
        }

        $logModel->save([
            'ip_address' => $this->request->getIPAddress(),
            'user_id'    => $userId,
            'action'     => 'success_reward_redemption',
            'details'    => "Reward ID: {$rewardId} ({$reward['title']})"
        ]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            $error = $db->error();
            log_message('error', 'Redemption Transaction Failed: ' . json_encode($error));
            log_message('error', 'Validation Errors (User): ' . json_encode($userModel->errors()));
            log_message('error', 'Validation Errors (Redemption): ' . json_encode($redemptionModel->errors()));
            return $this->fail('Error al procesar el canje. Verifica los datos o intenta de nuevo.');
        }

        if ($reward['type'] === 'physical') {
            // Ensure we use the correct base URL for the image
            // Fallback to hardcoded dev URL if base_url is not set correctly yet by environment
            $baseUrl  = 'https://dev.takisaficionintensa.com.mx/api';
            $imageUrl = $baseUrl . '/uploads/rewards/' . $reward['image_url'];

            $subject = 'Tu canje está siendo procesado';
            $title   = '¡CANJE EXITOSO!';

            // Build custom HTML fragment for the message part
            $msg  = "<p>Tu orden #{$redemptionId} ha sido recibida.</p>";
            $msg .= "<p>Hemos recibido tu solicitud para: <br><strong>{$reward['title']}</strong></p>";
            $msg .= "<div style='margin: 20px 0;'><img src='{$imageUrl}' alt='Recompensa' style='max-width: 50%; border-radius: 10px; border: 2px solid #F2E74B;'></div>";
            $msg .= "<p>Pronto recibirás más noticias sobre tu envío.</p>";

            EmailSender::sendEmail($user['email'], $subject, $title, $msg);
        }

        return $this->respond([
            'status'  => 'success',
            'message' => '¡Canje exitoso!',
            'pdf_url' => $pdfUrl,
            'code'    => $finalCodeString
        ]);
    }


    private function generateAndSavePdf($user, $reward, $redemptionId, $codes)
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

            // Parse code_areas format
            $codeAreas = $reward['code_areas'] ?? '';

            // Normalize codes to array
            if (!is_array($codes)) {
                $codes = explode(',', $codes);
            }

            if (!empty($codeAreas)) {
                $areas = explode(';', $codeAreas);

                foreach ($areas as $index => $areaStr) {
                    $areaStr = trim($areaStr);
                    if (empty($areaStr))
                        continue;

                    // Get Corresponding Code for this area
                    // If we have fewer codes than areas, fallback to the first one (or last?)
                    // Logic dictated: "Tomar el mismo número de códigos". So index should match.
                    $currentCode = isset($codes[$index]) ? $codes[$index] : $codes[0];

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
                            $pdf->Cell($w, $h, $currentCode, 0, 0, 'C');
                        } else {
                            $pdf->Text($x, $y, $currentCode);
                        }
                    }
                }
            } else {
                // Fallback for coordinates JSON or simple text
                // Use the first code
                $codeToPrint = $codes[0] ?? 'CODE';

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
                        $pdf->Cell($w, $h, $codeToPrint, 0, 0, 'C');
                    } else {
                        $pdf->Text($x, $y, $codeToPrint);
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
        $history         = $redemptionModel->select('redemptions.*, rewards.title, rewards.image_url, rewards.cost, rewards.type')
            ->join('rewards', 'rewards.id = redemptions.reward_id')
            ->where('user_id', $userId)
            ->orderBy('redemptions.created_at', 'DESC')
            ->findAll();

        return $this->respond($history);
    }
}
