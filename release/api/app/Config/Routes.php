<?php

namespace Config;

use CodeIgniter\Config\BaseConfig;
use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

// API Routes
$routes->group('api', function ($routes) {
    // Auth
    $routes->post('auth/register', 'AuthController::register');
    $routes->post('auth/verify-otp', 'AuthController::verifyOtp');
    $routes->post('auth/login', 'AuthController::login');

    // User Portal
    $routes->get('profile', 'ProfileController::index', ['filter' => 'auth']);
    $routes->post('profile/update', 'ProfileController::update', ['filter' => 'auth']);
    $routes->get('rewards', 'RewardAdminController::getRewards');
    $routes->post('redeem', 'RedemptionController::redeemCode', ['filter' => 'auth']);

    // Support
    $routes->post('support/ticket', 'SupportController::createTicket', ['filter' => 'auth']);

    // Admin
    $routes->group('admin', ['filter' => 'auth:admin'], function ($routes) {
        $routes->get('stats', 'AdminStatsController::index');
        $routes->post('rewards', 'RewardAdminController::createReward');
        $routes->post('rewards/(:num)/codes', 'RewardAdminController::addCodes/$1');
        $routes->get('orders', 'OrdersController::getOrders');
        $routes->post('orders/(:num)/status', 'OrdersController::updateStatus/$1');
        $routes->get('support', 'SupportController::getTickets');
        $routes->post('support/(:num)/reply', 'SupportController::replyTicket/$1');

        // Uploads
        $routes->post('upload-image', 'UploadController::uploadRewardImage');
        $routes->post('upload-pdf', 'UploadController::uploadTemplate');
    });
});
