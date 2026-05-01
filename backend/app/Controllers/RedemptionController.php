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
        // Force Mexico City timezone for campaign end check
        date_default_timezone_set('America/Mexico_City');

        // AUTOMATIC DISABLE AT MAY 1st, 2026 00:00:00
        if (strtotime(date('Y-m-d H:i:s')) >= strtotime('2026-05-01 00:00:00')) {
            return $this->fail('El registro de códigos ha terminado.', 403);
        }

        $db         = \Config\Database::connect();
        $promoModel = new PromoCodeModel();
        $userModel  = new UserModel();
        $logModel   = new SecurityLogModel();

        $ip     = $this->request->getIPAddress();
        $userId = $this->request->user->id ?? $this->request->user->uid;
        $code   = $this->request->getVar('code');

        // Verify if user is blocked
        $currentUser   = $userModel->find($userId);
        $isWhitelisted = $currentUser && isset($currentUser['is_whitelisted']) && (int) $currentUser['is_whitelisted'] === 1;

        if ($currentUser && isset($currentUser['is_blocked']) && (int) $currentUser['is_blocked'] === 1 && !$isWhitelisted) {
            return $this->fail('Tu cuenta ha sido bloqueada. No puedes realizar esta accion.', 403);
        }

        // Block specific email domains
        $blockedDomains = [
            'ostahie.com',
            'hutudns.com',
            'creteanu.com',
            'netoiu.com',
            'fentaoba.com',
            'kaoing.com',
            'bitoini.com',
            'dolofan.com',
            'pazuric.com',
            'bultoc.com',
            'esyline.com',
            'seaswar.com',
            'amiralty.com',
            'alibto.com',
            'rivken.com',
            'boftm.com',
            'barneu.com',
            'cosxo.com',
            'advarm.com',
            'teszari.com',
            'cslua.com',
            'feriwor.com',
            'daerdy.com'
        ];
        try {
            $db        = \Config\Database::connect();
            $dbDomains = $db->table('blocked_domains')->select('domain')->get()->getResultArray();
            foreach ($dbDomains as $d) {
                $blockedDomains[] = strtolower($d['domain']);
            }
        } catch (\Throwable $e) {
            log_message('error', 'RedemptionController Domain Error: ' . $e->getMessage());
        }

        if ($currentUser && !empty($currentUser['email'])) {
            $emailParts = explode('@', $currentUser['email']);
            if (count($emailParts) === 2) {
                $domain = strtolower($emailParts[1]);
                if (in_array($domain, $blockedDomains)) {
                    return $this->fail('Por el momento no podemos procesar la solicitud.', 403);
                }
            }
        }


        // ... (al inicio de redeemCode, antes de rate limiting basico)
        if (!$isWhitelisted) {
            try {
                // 🛡️ ADVANCED SECURITY SUITE (Honeypot, Fingerprint, Entropy, etc.)
                $securityResult = $this->_performAdvancedSecurityChecks($userId, $code, $ip);
                if ($securityResult !== true) {
                    return $this->fail($securityResult['message'], $securityResult['code']);
                }
            } catch (\Throwable $e) {
                log_message('critical', 'Security Check Fatal Error: ' . $e->getMessage());
                // Fail-open for safety
            }
        }

        /*
         * 🛡️ SISTEMA ANTI-FRAUDE Y RATE LIMITING
         * Reglas estrictas para detener ataques de fuerza bruta y automatización.
         */
        $now   = date('Y-m-d H:i:s');
        $today = date('Y-m-d 00:00:00');

        if (!$isWhitelisted) {
            $velocityCheck = $logModel->where('ip_address', $ip)
                ->where('last_attempt >=', date('Y-m-d H:i:s', strtotime('-1 minute')))
                ->countAllResults();

            if ($velocityCheck >= 4) {
                // AUTO-BLOCK USER PERMANENTLY (Velocity Violation)
                $userModel->update($userId, [
                    'is_blocked'     => 1,
                    'blocked_reason' => 'Sistema Anti-Fraude: Velocidad de canje excesiva (Posible Bot)',
                    'blocked_at'     => $now
                ]);

                // Log attack attempt & block
                log_message('critical', "Velocity Auto-Block. IP: {$ip} User: {$userId}");
                $logModel->save([
                    'ip_address' => $ip,
                    'user_id'    => $userId,
                    'action'     => 'auto_block',
                    'details'    => 'Usuario bloqueado por velocidad excesiva (>4 intentos/min)'
                ]);

                return $this->fail('Tu cuenta ha sido bloqueada. No puedes realizar esta accion.', 403);
            }

            // 1.5 MEDIUM TERM VELOCITY: Detectar "Throttling Quirurgico"
            $mediumVelocityCheck = $logModel->where('user_id', $userId)
                ->where('last_attempt >=', date('Y-m-d H:i:s', strtotime('-5 minutes')))
                ->countAllResults();

            if ($mediumVelocityCheck >= 8) {
                // AUTO-BLOCK USER PERMANENTLY (Medium Velocity Violation)
                $userModel->update($userId, [
                    'is_blocked'     => 1,
                    'blocked_reason' => 'Sistema Anti-Fraude: Patron de canje sospechoso (Throttling)',
                    'blocked_at'     => $now
                ]);

                $logModel->save([
                    'ip_address' => $ip,
                    'user_id'    => $userId,
                    'action'     => 'auto_block',
                    'details'    => 'Usuario bloqueado por patron de throttling (>8 intentos/5min)'
                ]);

                return $this->fail('Tu cuenta ha sido bloqueada. No puedes realizar esta accion.', 403);
            }

            // 2. DAILY CAP (USER): Límite estricto de códigos exitosos por día
            $userDailyCount = $promoModel->where('used_by', $userId)
                ->where('used_at >=', $today)
                ->countAllResults();

            if ($userDailyCount >= 20) {
                // 2.1 DETECTAR ABUSO PERSISTENTE: Si sigue intentando tras alcanzar el límite
                $abuseAttempts = $logModel->where('user_id', $userId)
                    ->where('action', 'daily_limit_reached')
                    ->where('last_attempt >=', $today)
                    ->countAllResults();

                if ($abuseAttempts >= 4) { // Al 5to intento fallido por límite, bloquear.
                    $userModel->update($userId, [
                        'is_blocked'     => 1,
                        'blocked_reason' => 'Sistema Anti-Fraude: Abuso de limite diario (Persistencia)',
                        'blocked_at'     => $now
                    ]);

                    $logModel->save(['ip_address' => $ip, 'user_id' => $userId, 'action' => 'auto_block', 'details' => 'Usuario bloqueado por insistencia tras limite diario']);
                    return $this->fail('Tu cuenta ha sido bloqueada. No puedes realizar esta accion.', 403);
                }

                // Registrar intento fallido por límite
                $logModel->save([
                    'ip_address' => $ip,
                    'user_id'    => $userId,
                    'action'     => 'daily_limit_reached',
                    'details'    => 'Intento con limite diario alcanzado'
                ]);

                return $this->fail('Has alcanzado tu límite diario de 20 códigos Takis. ¡Vuelve mañana para seguir participando!', 429);
            }

            // 3. BRUTE FORCE DETECTION (USER): Bloqueo automático si falla muchos códigos seguidos
            $recentFailures = $logModel->where('user_id', $userId)
                ->where('action', 'failed_redeem')
                ->where('last_attempt >=', date('Y-m-d H:i:s', strtotime('-10 minutes')))
                ->countAllResults();

            if ($recentFailures >= 5) {
                // AUTO-BLOCK USER PERMANENTLY
                $userModel->update($userId, [
                    'is_blocked'     => 1,
                    'blocked_reason' => 'Sistema Anti-Fraude: Detección de Fuerza Bruta (Múltiples códigos inválidos)',
                    'blocked_at'     => $now
                ]);

                $logModel->save([
                    'ip_address' => $ip,
                    'user_id'    => $userId,
                    'action'     => 'auto_block',
                    'details'    => 'Usuario bloqueado permanentemente por exceso de intentos fallidos (5 en <10min)'
                ]);

                return $this->fail('Tu cuenta ha sido bloqueada. No puedes realizar esta accion.', 403);
            }
        }

        // 4. IP HOARDING CHECK: Si una IP ha registrado canjes en más de 3 cuentas distintas hoy -> Bloquear IP (Opcional, por ahora solo log)
        // (Dejado como comentario para futura expansión si persiste el fraude de IP compartida)

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

        // Block specific email domains
        $blockedDomains = [
            'ostahie.com',
            'hutudns.com',
            'creteanu.com',
            'netoiu.com',
            'fentaoba.com',
            'kaoing.com',
            'bitoini.com',
            'dolofan.com',
            'pazuric.com',
            'bultoc.com',
            'esyline.com',
            'seaswar.com',
            'amiralty.com',
            'alibto.com',
            'rivken.com',
            'boftm.com',
            'barneu.com',
            'cosxo.com',
            'advarm.com',
            'teszari.com',
            'cslua.com',
            'feriwor.com',
            'daerdy.com'
        ];
        try {
            $db        = \Config\Database::connect();
            $dbDomains = $db->table('blocked_domains')->select('domain')->get()->getResultArray();
            foreach ($dbDomains as $d) {
                $blockedDomains[] = strtolower($d['domain']);
            }
        } catch (\Throwable $e) {
            log_message('error', 'RedemptionController Domain Error 2: ' . $e->getMessage());
        }

        if ($user && !empty($user['email'])) {
            $emailParts = explode('@', $user['email']);
            if (count($emailParts) === 2) {
                $domain = strtolower($emailParts[1]);
                if (in_array($domain, $blockedDomains)) {
                    return $this->fail('Por el momento no podemos procesar la solicitud.', 403);
                }
            }
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
                $missing[] = 'Calle';
            if (empty($user['numero_exterior']))
                $missing[] = 'Número Exterior';
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
                'numero_exterior' => $user['numero_exterior'] ?? '',
                'numero_interior' => $user['numero_interior'] ?? '',
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
        $currentUser   = $userModel->find($userId);
        $isWhitelisted = $currentUser && isset($currentUser['is_whitelisted']) && (int) $currentUser['is_whitelisted'] === 1;

        // 🛡️ [NUEVO] WHITELIST BYPASS TOTAL
        // Si el usuario es de confianza, no ejecutamos ninguna validación de seguridad de ráfaga o patrones.
        if ($isWhitelisted) {
            log_message('info', "Security: Whitelisted User bypass active. User: {$userId}");
            return true;
        }

        // 1. 🍯 HONEYPOT TRAP (Trampa de Miel)
        // Campo invisible 'website_check' o similar. Si tiene valor -> BLOQUEO.
        $honeypot = $request->getVar('website_check');
        if (!empty($honeypot)) {
            if ($isWhitelisted) {
                log_message('warning', "Security: Whitelisted User triggered Honeypot. User: {$userId}");
            } else {
                $this->_blockUser($userId, 'Sistema Anti-Fraude: Honeypot Triggered (Bot detectado)', $ip);
                return ['message' => 'Tu cuenta ha sido bloqueada. No puedes realizar esta accion.', 'code' => 403];
            }
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
                return ['message' => 'Error de validación. Por favor intenta de nuevo.', 'code' => 400];
            }
        }

        // 3. 🔒 HEADER GUARD (Validación de Origen)
        // Verificar que venga de nuestro dominio (evita cURL/Postman directos).
        $referer = $request->getServer('HTTP_REFERER');
        $origin  = $request->getServer('HTTP_ORIGIN');
        $allowed = 'takisaficionintensa.com.mx';

        // Permitir localhost para dev, pero en prod ser estricto
        $isDev = strpos($referer, 'localhost') !== false || strpos($referer, 'dev.') !== false;

        if (!$isDev && !empty($referer) && strpos($referer, $allowed) === false) {
            // Origen inválido -> Bloquear IP (no user, porque puede ser spoofed, pero IP es segura)
            // Realmente aqui solo rechazamos.
            log_message('critical', "Security: Header Guard Fail. Referer: {$referer}. Origin: {$origin}");
            return ['message' => 'Acceso denegado. Origen no válido.', 'code' => 403];
        }

        // 4. 📱 FINGERPRINT MULTI-ACCOUNT (Huella Digital)
        // Frontend envía 'device_fp'. Si >3 usuarios usan mismo FP en 1 hora -> BLOQUEO MASIVO.
        $deviceFp = $request->getVar('device_fp');
        if (!empty($deviceFp)) {
            // Check usage of this FP by DISTINCT users in last hour
            // Note: This requires extracting device_fp from logs details field since we dont have a col.
            // Assuming we log it now. We check logs where details LIKE %device_fp%... expensive query 
            // but necessary. Or better, we trust the System Log logic we are adding now.

            // To be efficient, we rely on the Log Model being populated with this FP in 'details' for future.

            // Query logic: Find logs in last hour containing this FP and extract distinct user_ids.
            // Since JSON extraction in generic SQL is tricky without specific driver schema, 
            // we will simulate this check or assume a dedicated log structure in future.
            // For now, simpler approach: If we see this FP associated with > 3 users in 'security_logs'
            // We need to query: SELECT count(distinct user_id) FROM security_logs WHERE date > -1 hour AND details LIKE '%$deviceFp%'

            // Implementation: Ensure $deviceFp is not empty to avoid matching all logs
            if (empty($deviceFp)) {
                return true; 
            }

            $fpQuery = $logModel->select('user_id')->distinct()
                ->like('details', $deviceFp)
                ->where('last_attempt >=', date('Y-m-d H:i:s', strtotime('-1 hour')))
                ->findAll();

            if (count($fpQuery) >= 2) {
                if ($isWhitelisted) {
                    log_message('warning', "Security: Whitelisted User triggered Fingerprint Check. User: {$userId}");
                } else {
                    // Bloquear a TODOS los usuarios implicados (Actual + Anteriores detectados en la última hora)
                    foreach ($fpQuery as $suspicious) {
                        $reason = ($suspicious['user_id'] == $userId)
                            ? 'Sistema Anti-Fraude: Dispositivo sospechoso (Multicuenta - Actual)'
                            : 'Sistema Anti-Fraude: Dispositivo sospechoso (Multicuenta - Retroactivo)';

                        // Bloquear usuario
                        $this->_blockUser($suspicious['user_id'], $reason, $ip);
                    }

                    return ['message' => 'Tu cuenta ha sido bloqueada por actividad sospechosa.', 'code' => 403];
                }
            }
        }

        // 5. 👥 BATCH PATTERN (Prefijos Compartidos)
        // Regla: >= 2 usuarios con mismo prefijo (8 chars) en 5 min -> Error Falso.
        $prefix = !empty($code) ? substr($code, 0, 8) : ''; 
        if (strlen($prefix) >= 5) {
            // Count distinct users who tried this prefix in last 5 mins
            $batchCheck = $logModel->select('user_id')->distinct()
                ->groupStart()
                ->like('details', "Code Redeemed: {$prefix}", 'after')
                ->orLike('details', "Invalid Code: {$prefix}", 'after')
                ->groupEnd()
                ->where('last_attempt >=', date('Y-m-d H:i:s', strtotime('-5 minutes')))
                ->findAll();

            // Filter self out - Ensure we check if results are arrays or objects
            $otherUsers = array_filter($batchCheck, function ($row) use ($userId) {
                $rowId = is_array($row) ? ($row['user_id'] ?? null) : ($row->user_id ?? null);
                return $rowId && $rowId != $userId;
            });

            if (count($otherUsers) >= 1) { 
                log_message('warning', "Security: Batch Pattern Detected. Prefix: {$prefix}");
                return ['message' => 'Código inválido. Verificalo nuevamente.', 'code' => 404];
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

                    // If distance is very small (e.g. 1 or 2 chars different in a long code) -> Sequential?
                    // Example: TK12345A vs TK12345B -> dist 1.
                    if ($len > 8 && $dist <= 2) {
                        if ($isWhitelisted) {
                            log_message('warning', "Security: Whitelisted User triggered Entropy Check. User: {$userId}");
                        } else {
                            // High similarity. Likely sequential.
                            // BLOCK USER.
                            $this->_blockUser($userId, 'Sistema Anti-Fraude: Codigos secuenciales detectados (Entropy Check)', $ip);
                            return ['message' => 'Tu cuenta ha sido bloqueada. No puedes realizar esta accion.', 'code' => 403];
                        }
                    }
                }
            }
        }

        return true; // All checks passed
    }

    // Helper to block user
    private function _blockUser($userId, $reason, $ip)
    {
        $userModel = new UserModel();
        $user      = $userModel->find($userId);

        // WHITE LIST CHECK
        if ($user && isset($user['is_whitelisted']) && (int) $user['is_whitelisted'] === 1) {
            log_message('warning', "Security: Block Attempt on Whitelisted User. User: {$userId}. Reason: {$reason}");
            return false; // Did not block
        }

        $userModel->update($userId, [
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
        return true;
    }
}
