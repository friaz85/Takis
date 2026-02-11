<?php

namespace App\Controllers;

use CodeIgniter\RESTful\ResourceController;
use App\Models\RedemptionModel;
use App\Models\UserModel;
use App\Libraries\EmailSender;

class AdminOrdersController extends ResourceController
{
    protected $format = 'json';

    /**
     * Get all orders/redemptions
     */
    public function index()
    {
        $redemptionModel = new RedemptionModel();
        $userModel       = new UserModel();

        // Get all redemptions with user and reward info
        $redemptions = $redemptionModel
            ->select('redemptions.*, users.full_name as user_name, users.email as user_email, rewards.title as reward_title, rewards.cost as points_cost')
            ->join('users', 'users.id = redemptions.user_id')
            ->join('rewards', 'rewards.id = redemptions.reward_id')
            ->where('rewards.type', 'physical')
            ->orderBy('redemptions.created_at', 'DESC')
            ->findAll();

        return $this->respond($redemptions);
    }

    /**
     * Update order status and tracking info
     */
    public function updateOrder($id = null)
    {
        if (!$id) {
            return $this->fail('ID de pedido requerido');
        }

        $redemptionModel = new RedemptionModel();
        $userModel       = new UserModel();

        $data = $this->request->getJSON(true);

        // Get current order
        $order = $redemptionModel->find($id);
        if (!$order) {
            return $this->failNotFound('Pedido no encontrado');
        }

        // Prepare update data
        $updateData = [];
        if (isset($data['status']))
            $updateData['status'] = $data['status'];
        if (isset($data['admin_notes']))
            $updateData['admin_notes'] = $data['admin_notes'];
        if (isset($data['tracking_number']))
            $updateData['tracking_number'] = $data['tracking_number'];
        if (isset($data['tracking_url']))
            $updateData['tracking_url'] = $data['tracking_url'];
        if (isset($data['delivery_date']))
            $updateData['delivery_date'] = $data['delivery_date'];

        // Update order
        $redemptionModel->update($id, $updateData);

        // Send email notification if status changed
        if (isset($data['status']) && $data['status'] !== $order['status']) {
            $user = $userModel->find($order['user_id']);
            $this->sendStatusEmail($user, $order, $data['status'], $data);
        }

        return $this->respond([
            'status'  => 'success',
            'message' => 'Pedido actualizado correctamente'
        ]);
    }

    /**
     * Send email notification based on status
     */
    private function sendStatusEmail($user, $order, $newStatus, $orderData)
    {
        $emailTemplates = [
            'processing' => [
                'subject' => 'Tu pedido está siendo procesado',
                'title'   => '⏳ PEDIDO EN PROCESO',
                'message' => "Hola {$user['full_name']},<br><br>Tu pedido #{$order['id']} está siendo procesado por nuestro equipo.<br><br>Te notificaremos cuando sea enviado."
            ],
            'shipped'    => [
                'subject' => 'Tu pedido ha sido enviado',
                'title'   => '📦 PEDIDO ENVIADO',
                'message' => "Hola {$user['full_name']},<br><br>¡Buenas noticias! Tu pedido #{$order['id']} ha sido enviado.<br><br>" .
                    (!empty($orderData['tracking_url']) ?
                        "Puedes rastrear tu paquete aquí: <a href='{$orderData['tracking_url']}' style='color: #F2E74B;'>{$orderData['tracking_url']}</a><br><br>" :
                        "") .
                    (!empty($orderData['tracking_number']) ?
                        "Número de guía: <strong>{$orderData['tracking_number']}</strong><br><br>" :
                        "") .
                    "Recibirás tu pedido pronto."
            ],
            'delivered'  => [
                'subject' => '¡Tu pedido ha sido entregado!',
                'title'   => '✅ PEDIDO ENTREGADO',
                'message' => "Hola {$user['full_name']},<br><br>¡Felicidades! Tu pedido #{$order['id']} ha sido entregado.<br><br>" .
                    "<div style='text-align: center;'>" .
                    "<img src='" . base_url('uploads/email_templates/delivered_winner.jpg') . "' style='max-width: 100%; border-radius: 15px; margin: 20px 0;'>" .
                    "</div>" .
                    "No olvides etiquetarnos en redes sociales <strong>@takis_mx</strong> 🌶️"
            ]
        ];

        if (isset($emailTemplates[$newStatus])) {
            $template = $emailTemplates[$newStatus];
            EmailSender::sendEmail(
                $user['email'],
                $template['subject'],
                $template['title'],
                $template['message']
            );
        }
    }
}
