<?php

namespace Config;

// Create a new instance of our RouteCollection class.
$routes = Services::routes();

// Load the system's routing file first, so that the app and ENVIRONMENT
// can override as needed.
if (file_exists(SYSTEMPATH . 'Config/Routes.php')) {
    require SYSTEMPATH . 'Config/Routes.php';
}

/*
 * --------------------------------------------------------------------
 * Router Setup
 * --------------------------------------------------------------------
 */
$routes->setDefaultNamespace('App\Controllers');
$routes->setDefaultController('Home');
$routes->setDefaultMethod('index');
$routes->setTranslateURIDashes(false);
$routes->set404Override();

/*
 * --------------------------------------------------------------------
 * Route Definitions
 * --------------------------------------------------------------------
 */






// Update Schema
$routes->get('update-schema', 'UpdatePromoSchemaController::update');

// Setup DB
$routes->get('setup-db', 'SetupController::index');

// Debug
$routes->get('debug-codes', 'DebugController::index');
$routes->get('debug-status', 'DebugController::testStatus');

// Public Catalog
$routes->get('rewards', 'RewardAdminController::publicCatalog');

// Auth
$routes->post('auth/register', 'AuthController::register');
$routes->post('auth/verify-otp', 'AuthController::verifyOtp');
$routes->post('auth/login', 'AuthController::login');
$routes->post('auth/login-otp-request', 'AuthController::requestLoginOtp');

// Admin Auth
$routes->post('admin/auth/login', 'AdminAuthController::login');

// Protected Routes (User)
$routes->group('', ['filter' => 'auth'], function ($routes) {
    $routes->get('profile', 'ProfileController::getProfile');
    $routes->get('user/points/(:num)', 'ProfileController::getPoints/$1');
    $routes->get('user/codes/(:num)', 'RedemptionController::codesHistory/$1');
    $routes->get('user/rewards/(:num)', 'RedemptionController::rewardsHistory/$1');
    $routes->post('profile', 'ProfileController::updateProfile');
    $routes->post('codes/redeem', 'RedemptionController::redeemCode');
    $routes->post('codes/validate', 'RedemptionController::redeemCode');
    $routes->get('user/history', 'RedemptionController::history');
    $routes->post('redeem', 'RedemptionController::redeemReward');
});

// Admin Routes
$routes->group('admin', ['filter' => 'admin_auth'], function ($routes) {
    // Reward Admin using RewardAdminController
    $routes->get('rewards', 'RewardAdminController::index');
    $routes->post('rewards', 'RewardAdminController::createReward');
    $routes->post('rewards/create', 'RewardAdminController::createReward');
    $routes->post('rewards/(:num)/update', 'RewardAdminController::updateReward/$1');
    $routes->put('rewards/update/(:num)', 'RewardAdminController::updateReward/$1');
    $routes->delete('rewards/(:num)', 'RewardAdminController::deleteReward/$1');

    // Stats and Dashboard
    $routes->get('dashboard', 'DashboardAdminController::getStats');
    $routes->get('stats', 'DashboardAdminController::getStats');
    $routes->get('special-redeem-users', 'AdminStatsController::getSpecialRedeemUsers');
    $routes->post('manual-redeem', 'AdminRedemptionsController::manualRedeem');
    $routes->get('users', 'AdminUserController::index');
    $routes->get('users/stats', 'AdminUserController::getStats');
    $routes->post('users/(:num)/toggle-block', 'AdminUserController::toggleBlock/$1');
    $routes->get('entry-codes', 'AdminEntryCodeController::index');
    $routes->get('redemptions', 'AdminRedemptionsController::index');

    // Blocked Domains Management
    $routes->get('blocked-domains', 'AdminDomainsController::index');
    $routes->post('blocked-domains', 'AdminDomainsController::create');
    $routes->delete('blocked-domains/(:num)', 'AdminDomainsController::delete/$1');

    // Promo Codes Management
    $routes->get('promo-codes', 'AdminPromoCodesController::index');
    $routes->post('promo-codes/generate', 'AdminPromoCodesController::generate');
    $routes->post('promo-codes/upload', 'AdminPromoCodesController::upload');

    // Orders Management
    $routes->get('orders', 'AdminOrdersController::index');
    $routes->post('orders/(:num)/update', 'AdminOrdersController::updateOrder/$1');

    // Support Tickets Management
    $routes->get('support', 'AdminSupportController::index');
    $routes->get('support/stats', 'AdminSupportController::getStats');
    $routes->get('support/(:num)', 'AdminSupportController::getTicket/$1');
    $routes->post('support/(:num)/update', 'AdminSupportController::updateTicket/$1');
    $routes->post('support/(:num)/response', 'AdminSupportController::addResponse/$1');

    // Uploads
    $routes->post('upload/reward-image', 'UploadController::uploadRewardImage');
    $routes->post('upload/template', 'UploadController::uploadTemplate');

    // Analytics
    $routes->get('analytics/stats', 'AnalyticsController::getVisitStats');
});

// Analytics Public
$routes->post('analytics/log', 'AnalyticsController::logVisit');

// Ultramsg API Routes (Public - No auth required)
$routes->group('api/ultramsg', function ($routes) {
    $routes->post('get-user', 'UltramsgApiController::getUser');
    $routes->post('create-ticket', 'UltramsgApiController::createTicket');
    $routes->post('add-response', 'UltramsgApiController::addResponse');
});

// Temporary Update Route (Bypass CLI)
$routes->get('cron/update-points', 'UpdatePromoSchemaController::manualUpdatePoints');

/*
 * --------------------------------------------------------------------
 * Additional Routing
 * --------------------------------------------------------------------
 */
if (defined('ENVIRONMENT') && file_exists(APPPATH . 'Config/' . ENVIRONMENT . '/Routes.php')) {
    require APPPATH . 'Config/' . ENVIRONMENT . '/Routes.php';
}
