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
            return $this->fail('Código inválido. Verifica que esté escrito correctamente. [TK-000]', 403);
        }


        // ... (al inicio de redeemCode, antes de rate limiting basico)
        // 🛡️ ADVANCED SECURITY SUITE (Honeypot, Fingerprint, Entropy, etc.)
        $securityResult = $this->_performAdvancedSecurityChecks($userId, $code, $ip);
        if ($securityResult !== true) {
            return $this->fail($securityResult['message'], $securityResult['code']);
        }

        /*
         * 🛡️ SISTEMA ANTI-FRAUDE Y RATE LIMITING
         * Reglas estrictas para detener ataques de fuerza bruta y automatización.
         */
        // 🕐 Asegurar timezone correcto para todos los cálculos de fecha/hora
        date_default_timezone_set('America/Mexico_City');
        $now   = date('Y-m-d H:i:s');
        $today = date('Y-m-d 00:00:00');

        // 1. VELOCITY CHECK por USUARIO (no por IP) — detecta rotación de proxies.
        // Antes chequeaba solo IP: con IPs rotatorias siempre era 0. CORREGIDO.
        $velocityCheckByUser = $logModel->where('user_id', $userId)
            ->where('action IN', ['success_redeem', 'failed_redeem', 'auto_block', 'daily_limit_reached'])
            ->where('last_attempt >=', date('Y-m-d H:i:s', strtotime('-1 minute')))
            ->countAllResults();

        if ($velocityCheckByUser >= 3) {
            $this->_blockUser($userId, 'Sistema Anti-Fraude: Velocidad de canje excesiva por usuario (Posible Bot/Proxy)', $ip);
            log_message('critical', "Velocity Auto-Block (User-Based). IP: {$ip} User: {$userId}");
            return $this->failNotFound('Código inválido. Verifica que esté escrito correctamente. [TK-001]');
        }

        // 1.2 VELOCITY CHECK por IP (se mantiene como capa adicional)
        $velocityCheckByIp = $logModel->where('ip_address', $ip)
            ->where('last_attempt >=', date('Y-m-d H:i:s', strtotime('-1 minute')))
            ->countAllResults();

        if ($velocityCheckByIp >= 4) {
            $this->_blockUser($userId, 'Sistema Anti-Fraude: Velocidad de canje excesiva por IP (Posible Bot)', $ip);
            log_message('critical', "Velocity Auto-Block (IP-Based). IP: {$ip} User: {$userId}");
            return $this->failNotFound('Código inválido. Verifica que esté escrito correctamente. [TK-002]');
        }

        // 🔄 PROXY ROTATION DETECTION: Si el mismo usuario usa > 3 IPs distintas en 1 hora → es un bot con proxy pool.
        $distinctIpsLastHour = $logModel->select('ip_address')->distinct()
            ->where('user_id', $userId)
            ->where('last_attempt >=', date('Y-m-d H:i:s', strtotime('-1 hour')))
            ->findAll();

        if (count($distinctIpsLastHour) >= 3) {
            $this->_blockUser($userId, 'Sistema Anti-Fraude: Rotacion de Proxies detectada (' . count($distinctIpsLastHour) . ' IPs distintas en 1h)', $ip);
            log_message('critical', "Proxy Rotation Auto-Block. User: {$userId}. IPs: " . implode(', ', array_column($distinctIpsLastHour, 'ip_address')));
            return $this->failNotFound('Código inválido. Verifica que esté escrito correctamente. [TK-003]');
        }

        // 1.5 MEDIUM TERM VELOCITY: Detectar "Throttling Quirurgico"
        // Reducido de 8 a 4: un humano normal no hace 4 canjes en 5 minutos.
        $mediumVelocityCheck = $logModel->where('user_id', $userId)
            ->where('action IN', ['success_redeem', 'failed_redeem'])
            ->where('last_attempt >=', date('Y-m-d H:i:s', strtotime('-5 minutes')))
            ->countAllResults();

        if ($mediumVelocityCheck >= 4) {
            $this->_blockUser($userId, 'Sistema Anti-Fraude: Patron de canje sospechoso (Throttling >4/5min)', $ip);
            $logModel->save([
                'ip_address' => $ip,
                'user_id'    => $userId,
                'action'     => 'auto_block',
                'details'    => 'Usuario bloqueado por patron de throttling (>4 canjes/5min)'
            ]);
            return $this->failNotFound('Código inválido. Verifica que esté escrito correctamente. [TK-004]');
        }

        // 2. DAILY CAP (USER): Máximo 20 canjes exitosos por usuario por día.
        $userDailyCount = $promoModel->where('used_by', $userId)
            ->where('used_at >=', $today)
            ->countAllResults();

        if ($userDailyCount >= 20) {
            // 2.1 DETECTAR ABUSO PERSISTENTE: Si sigue intentando tras alcanzar el límite
            $abuseAttempts = $logModel->where('user_id', $userId)
                ->where('action', 'daily_limit_reached')
                ->where('last_attempt >=', $today)
                ->countAllResults();

            if ($abuseAttempts >= 3) {
                $this->_blockUser($userId, 'Sistema Anti-Fraude: Abuso de limite diario (Persistencia)', $ip);
            }

            $logModel->save([
                'ip_address' => $ip,
                'user_id'    => $userId,
                'action'     => 'daily_limit_reached',
                'details'    => "Limite diario por usuario alcanzado ({$userDailyCount}/20)"
            ]);

            return $this->failNotFound('Código inválido. Verifica que esté escrito correctamente. [TK-005]');
        }

        // 2.2 DAILY CAP (IP): Máximo 60 canjes exitosos por IP por día.
        // Protege contra múltiples cuentas operadas desde la misma dirección IP.
        $ipDailyCount = $promoModel->where('used_ip', $ip)
            ->where('used_at >=', $today)
            ->countAllResults();

        if ($ipDailyCount >= 60) {
            $logModel->save([
                'ip_address' => $ip,
                'user_id'    => $userId,
                'action'     => 'daily_limit_reached',
                'details'    => "Limite diario por IP alcanzado ({$ipDailyCount}/60)"
            ]);
            return $this->failNotFound('Código inválido. Verifica que esté escrito correctamente. [TK-006]');
        }

        // 3. BRUTE FORCE DETECTION (USER): Bloqueo automático si falla muchos códigos seguidos
        // Si los últimos 5 intentos fueron fallidos y recientes -> Bloqueo de Cuenta
        $recentFailures = $logModel->where('user_id', $userId)
            ->where('action', 'failed_redeem')
            ->where('last_attempt >=', date('Y-m-d H:i:s', strtotime('-10 minutes')))
            ->countAllResults();

        if ($recentFailures >= 5) {
            $this->_blockUser($userId, 'Sistema Anti-Fraude: Detección de Fuerza Bruta (Múltiples códigos inválidos)', $ip);
            return $this->failNotFound('Código inválido. Verifica que esté escrito correctamente. [TK-007]');
        }

        // 4. IP HOARDING CHECK: Si una IP ha registrado canjes en más de 3 cuentas distintas hoy -> Bloquear IP (Opcional, por ahora solo log)
        // (Dejado como comentario para futura expansión si persiste el fraude de IP compartida)

        // Ensure we select points explicitly to be safe, though findAll/first should return all
        // First check if code exists at all
        $promo = $promoModel->where('code', $code)->first();

        if (!$promo) {
            // Log BEFORE starting transaction so it persists
            $logModel->save(['ip_address' => $ip, 'user_id' => $userId, 'action' => 'failed_redeem', 'details' => 'Invalid Code: ' . $code]);
            return $this->failNotFound('Código inválido. Verifica que esté escrito correctamente. [TK-008]');
        }

        if ($promo['is_used'] == 1) {
            // Log BEFORE starting transaction so it persists
            $logModel->save(['ip_address' => $ip, 'user_id' => $userId, 'action' => 'failed_redeem', 'details' => 'Code Already Used: ' . $code]);
            return $this->fail('Código inválido. Verifica que esté escrito correctamente. [TK-009]', 400);
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

        // Guardar FP en el log para que el Fingerprint check pueda detectar multicuentas en la siguiente petición
        $fpForLog = $this->request->getVar('device_fp') ?? 'no_fp';
        $logModel->save(['ip_address' => $ip, 'user_id' => $userId, 'action' => 'success_redeem', 'details' => 'Code Redeemed: ' . $code . ' | FP:' . $fpForLog]);
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
        if (strtolower($reward['type']) === 'physical') {
            $city    = !empty($user['city']) ? $user['city'] : ($user['municipio'] ?? '');
            $missing = [];
            if (empty($user['address']))
                $missing[] = 'Calle y número';
            if (empty($city))
                $missing[] = 'Municipio/Alcaldía';
            if (empty($user['state']))
                $missing[] = 'Estado';
            if (empty($user['zip_code']))
                $missing[] = 'Código Postal';
            if (empty($user['phone']))
                $missing[] = 'Teléfono';

            if (!empty($missing)) {
                $msg = 'Por favor completa los siguientes campos en tu perfil: ' . implode(', ', $missing);
                return $this->fail($msg, 400, 'PROFILE_INCOMPLETE');
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
        if (strtolower($reward['type']) === 'digital' && $newStock < 10 && $newStock > 0) {
            try {
                \App\Libraries\WhatsAppNotifier::sendLowStockAlert($reward['title'], $newStock);
            } catch (\Exception $e) {
                log_message('error', 'WhatsApp low stock notification failed: ' . $e->getMessage());
            }
        }

        $finalCodeString = implode(',', $codesList);

        // Prepare shipping details if physical
        $shippingDetails = null;
        if (strtolower($reward['type']) === 'physical') {
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

        if (strtolower($reward['type']) === 'digital') {
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

        if (strtolower($reward['type']) === 'physical') {
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
            $msg .= "<p style='font-size: 10px; color: #999; margin-top: -15px; font-style: italic;'>*Imagen de referencia</p>";
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

    /**
     * Realiza verificaciones de seguridad avanzadas.
     * Retorna true si pasa, o array con error ['message', 'code'] si falla.
     */
    private function _performAdvancedSecurityChecks($userId, $code, $ip)
    {
        $logModel  = new SecurityLogModel();
        $userModel = new UserModel();
        $request   = \Config\Services::request();
        $now       = date('Y-m-d H:i:s');

        // 1. 🍯 HONEYPOT TRAP (Trampa de Miel)
        // Campo invisible 'website_check' o similar. Si tiene valor -> BLOQUEO.
        $honeypot = $request->getVar('website_check');
        if (!empty($honeypot)) {
            $this->_blockUser($userId, 'Sistema Anti-Fraude: Honeypot Triggered (Bot detectado)', $ip);
            return ['message' => 'Código inválido. Verifica que esté escrito correctamente. [TK-010]', 'code' => 404];
        }

        // 2. ⏱️ TIME TRAP (Trampa de Velocidad)
        // [ACTIVADO y CORREGIDO]: En lugar de depender de 'render_ts' del cliente (que sufre de clock drift),
        // utilizamos la sesión del servidor (PHP) para llevar el control del tiempo real entre solicitudes.
        $session         = \Config\Services::session();
        $lastRequestTime = $session->get('last_redeem_attempt_time');
        $currentTime     = time();

        // Guardamos el timestamp actual para la próxima petición
        $session->set('last_redeem_attempt_time', $currentTime);

        if ($lastRequestTime) {
            $interactionTime = $currentTime - $lastRequestTime;
            // Si hace una solicitud en menos de 2 segundos desde la INTERACCIÓN ANTERIOR
            if ($interactionTime < 2) {
                log_message('warning', "Security: Session Time Trap Triggered. Interaction: {$interactionTime}s. User: {$userId}");
                return ['message' => 'Código inválido. Verifica que esté escrito correctamente. [TK-011]', 'code' => 404];
            }
        }

        // 3. 🔒 HEADER GUARD (Validación de Origen)
        // Verifica que la petición venga de nuestro dominio.
        // CORRECCIÓN: antes solo bloqueaba si el Referer era incorrecto.
        // Un bot con cURL jamás manda Referer — esos también deben ser bloqueados.
        $referer = $request->getServer('HTTP_REFERER') ?? '';
        $origin  = $request->getServer('HTTP_ORIGIN') ?? '';
        $allowed = 'takisaficionintensa.com.mx';

        $refererOk = !empty($referer) && strpos($referer, $allowed) !== false;
        $originOk  = !empty($origin) && strpos($origin, $allowed) !== false;
        $isDevEnv  = strpos($referer, 'localhost') !== false
            || strpos($referer, 'dev.') !== false
            || strpos($origin, 'localhost') !== false
            || strpos($origin, 'dev.') !== false;

        if (!$isDevEnv && !$refererOk && !$originOk) {
            // Ni Referer ni Origin válidos: petición directa a la API (bot/script)
            log_message('critical', "Security: Header Guard Fail. Referer: '{$referer}'. Origin: '{$origin}'");
            return ['message' => 'Código inválido. Verifica que esté escrito correctamente. [TK-012]', 'code' => 404];
        }

        // 4. 📱 FINGERPRINT MULTI-ACCOUNT (Huella Digital)
        // Frontend envía 'device_fp' (hash de user-agent + resolución + idioma + timezone).
        // Si >= 2 usuarios distintos usan el mismo FP en 1 hora -> BLOQUEO MASIVO.
        //
        // CORRECCIÓN: antes el check nunca funcionaba porque el FP no se guardaba en los logs.
        // Ahora se guarda en cada canje exitoso con el prefijo 'FP:' para que la query lo encuentre.
        $deviceFp = $request->getVar('device_fp') ?? '';
        if (!empty($deviceFp) && $deviceFp !== 'unknown_fp') {
            // Buscar en logs de la última hora todos los user_ids distintos que usaron este FP
            $fpQuery = $logModel->select('user_id')->distinct()
                ->like('details', 'FP:' . $deviceFp, 'after')
                ->where('last_attempt >=', date('Y-m-d H:i:s', strtotime('-1 hour')))
                ->findAll();

            // Filtrar solo otros usuarios (no el mismo)
            $otherFpUsers = array_filter($fpQuery, fn($row) => $row['user_id'] != $userId);

            if (count($otherFpUsers) >= 1) {
                // Al menos otro usuario en la última hora usó el mismo dispositivo → multicuenta
                // Deshabilitado temporalmente para no afectar a hermanos/amigos usando el mismo celular
                log_message('warning', "Fingerprint Multi-Account Block (Bypassed). FP: {$deviceFp}. User: {$userId}");
                // foreach (array_merge($fpQuery, [['user_id' => $userId]]) as $suspicious) {
                //     $uid    = $suspicious['user_id'];
                //     $reason = ($uid == $userId)
                //         ? 'Sistema Anti-Fraude: Dispositivo sospechoso (Multicuenta - Actual)'
                //         : 'Sistema Anti-Fraude: Dispositivo sospechoso (Multicuenta - Retroactivo)';
                //     $this->_blockUser($uid, $reason, $ip);
                // }
                // log_message('critical', "Fingerprint Multi-Account Block. FP: {$deviceFp}. User: {$userId}");
                // return ['message' => 'Código inválido. Verifica que esté escrito correctamente. [TK-013]', 'code' => 404];
            }
        }

        // 5. 👥 BATCH PATTERN (Prefijos Compartidos)
        // Regla: >= 2 usuarios con mismo prefijo (8 chars) en 5 min -> Error Falso.
        $prefix = substr($code, 0, 8); // Takis codes usually TK...
        if (strlen($prefix) >= 5) {
            // Count distinct users who tried this prefix in last 5 mins
            $batchCheck = $logModel->select('user_id')->distinct()
                ->groupStart()
                ->like('details', "Code Redeemed: {$prefix}", 'after') // Adjust match
                ->orLike('details', "Invalid Code: {$prefix}", 'after')
                ->groupEnd()
                ->where('last_attempt >=', date('Y-m-d H:i:s', strtotime('-5 minutes')))
                ->findAll();

            // Filter self out
            $otherUsers = array_filter($batchCheck, function ($row) use ($userId) {
                return $row['user_id'] != $userId;
            });

            if (count($otherUsers) >= 1) { // Means (Self + 1 other) = 2 users
                // FAKE ERROR "Código Incorrecto" to confuse bots sharing lists
                // Deshabilitado: puede afectar a usuarios con códigos impresos del mismo lote
                log_message('warning', "Security: Batch Pattern Detected (Bypassed). Prefix: {$prefix}");
                // return ['message' => 'Código inválido. Verifica que esté escrito correctamente. [TK-014]', 'code' => 404];
            }
        }

        // 6. 🔢 ENTROPY CHECK (Secuencialidad)
        // Comparar con el último código EXITOSO del usuario.
        $lastRedemption = (new RedemptionModel())->where('user_id', $userId)
            ->orderBy('created_at', 'DESC')
            ->first();

        if ($lastRedemption) {
            $lastCode = $lastRedemption['digital_code'] ?? '';
            // Note: digital_code might be outgoing reward code, not the INPUT code (promo code).
            // We need the PROMO CODE input.
            // We can get it from PromoCodeModel 'used_by' user order by used_at DESC.
            // Look back at last 3 codes to catch alternating patterns
            $lastPromos = (new PromoCodeModel())->where('used_by', $userId)
                ->orderBy('used_at', 'DESC')
                ->findAll(3);

            if (!empty($lastPromos)) {
                foreach ($lastPromos as $lastPromo) {
                    $prevCode = $lastPromo['code'];

                    // Compare $code vs $prevCode
                    // Calculate Levenshtein distance
                    $dist = levenshtein($code, $prevCode);
                    $len  = strlen($code);

                    // Patrón TKAF5RDXWQ → TKAF5RDXXR → dist=2. Umbral bajado a <= 3
                    // para capturar codigos secuenciales tipo TKAF5RD...
                    if ($len > 6 && $dist <= 3) {
                        // Deshabilitado: Lotes de empaques reales pueden tener códigos secuenciales (ej. terminación 19 y 20).
                        log_message('warning', "Sistema Anti-Fraude: Codigos secuenciales detectados (Bypassed) (Entropy dist={$dist}, code={$code})");
                        // $this->_blockUser($userId, "Sistema Anti-Fraude: Codigos secuenciales detectados (Entropy dist={$dist}, code={$code})", $ip);
                        // return ['message' => 'Código inválido. Verifica que esté escrito correctamente. [TK-015]', 'code' => 404];
                    }
                }
            }
        }

        return true; // All checks passed
    }

    // Helper to block user
    private function _blockUser($userId, $reason, $ip)
    {
        (new UserModel())->update($userId, [
            'is_blocked'     => 1,
            'blocked_reason' => $reason,
            'blocked_at'     => date('Y-m-d H:i:s')
        ]);
        (new SecurityLogModel())->save([
            'ip_address' => $ip,
            'user_id'    => $userId,
            'action'     => 'auto_block',
            'details'    => $reason
        ]);
    }
}
