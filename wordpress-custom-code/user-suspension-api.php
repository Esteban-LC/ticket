<?php
/**
 * Plugin Name: User Suspension API
 * Plugin URI: https://liq.com.mx
 * Description: Agrega endpoints REST API para suspender/habilitar usuarios y previene que usuarios suspendidos inicien sesión en WordPress.
 * Version: 1.0.0
 * Author: Paco
 * Author URI: https://liq.com.mx
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: user-suspension-api
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register batch REST API endpoints for user management.
 */
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/users/batch/suspend', array(
        'methods' => 'POST',
        'callback' => 'custom_suspend_users_batch',
        'permission_callback' => function () {
            return current_user_can('edit_users');
        },
        'args' => array(
            'user_ids' => array(
                'required' => true,
                'validate_callback' => function ($param) {
                    if (!is_array($param) || empty($param)) {
                        return false;
                    }

                    foreach ($param as $user_id) {
                        if (!is_numeric($user_id) || intval($user_id) <= 0) {
                            return false;
                        }
                    }

                    return true;
                }
            ),
            'reason' => array(
                'required' => false,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_textarea_field'
            ),
        ),
    ));

    register_rest_route('custom/v1', '/users/batch/unsuspend', array(
        'methods' => 'POST',
        'callback' => 'custom_unsuspend_users_batch',
        'permission_callback' => function () {
            return current_user_can('edit_users');
        },
        'args' => array(
            'user_ids' => array(
                'required' => true,
                'validate_callback' => function ($param) {
                    if (!is_array($param) || empty($param)) {
                        return false;
                    }

                    foreach ($param as $user_id) {
                        if (!is_numeric($user_id) || intval($user_id) <= 0) {
                            return false;
                        }
                    }

                    return true;
                }
            ),
        ),
    ));

    register_rest_route('custom/v1', '/users/batch/delete', array(
        'methods' => 'POST',
        'callback' => 'custom_delete_users_batch',
        'permission_callback' => function () {
            return current_user_can('delete_users');
        },
        'args' => array(
            'user_ids' => array(
                'required' => true,
                'validate_callback' => function ($param) {
                    if (!is_array($param) || empty($param)) {
                        return false;
                    }

                    foreach ($param as $user_id) {
                        if (!is_numeric($user_id) || intval($user_id) <= 0) {
                            return false;
                        }
                    }

                    return true;
                }
            ),
            'reassign' => array(
                'required' => false,
                'validate_callback' => function ($param) {
                    return $param === null || $param === '' || (is_numeric($param) && intval($param) > 0);
                }
            ),
        ),
    ));

    register_rest_route('custom/v1', '/users/batch/create', array(
        'methods' => 'POST',
        'callback' => 'custom_create_users_batch',
        'permission_callback' => function () {
            return current_user_can('create_users');
        },
        'args' => array(
            'users' => array(
                'required' => true,
                'validate_callback' => function ($param) {
                    return is_array($param) && !empty($param);
                }
            ),
        ),
    ));
});

/**
 * Register custom REST API endpoints for user suspension
 */
add_action('rest_api_init', function () {
    // Endpoint to suspend a user
    register_rest_route('custom/v1', '/users/(?P<id>\d+)/suspend', array(
        'methods' => 'POST',
        'callback' => 'custom_suspend_user',
        'permission_callback' => function () {
            return current_user_can('edit_users');
        },
        'args' => array(
            'id' => array(
                'validate_callback' => function ($param) {
                    return is_numeric($param);
                }
            ),
            'reason' => array(
                'required' => false,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_textarea_field'
            ),
        ),
    ));

    // Endpoint to unsuspend a user
    register_rest_route('custom/v1', '/users/(?P<id>\d+)/unsuspend', array(
        'methods' => 'POST',
        'callback' => 'custom_unsuspend_user',
        'permission_callback' => function () {
            return current_user_can('edit_users');
        },
        'args' => array(
            'id' => array(
                'validate_callback' => function ($param) {
                    return is_numeric($param);
                }
            ),
        ),
    ));

    // Endpoint to check suspension status
    register_rest_route('custom/v1', '/users/(?P<id>\d+)/suspension-status', array(
        'methods' => 'GET',
        'callback' => 'custom_get_suspension_status',
        'permission_callback' => function () {
            return current_user_can('edit_users');
        },
        'args' => array(
            'id' => array(
                'validate_callback' => function ($param) {
                    return is_numeric($param);
                }
            ),
        ),
    ));
});

/**
 * Endpoints de cursos (fallback cuando /wp/v2/courses no está disponible)
 */
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/courses', array(
        'methods' => 'GET',
        'callback' => 'custom_get_courses',
        'permission_callback' => function () {
            return current_user_can('edit_users');
        },
    ));

    register_rest_route('custom/v1', '/courses/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'custom_get_course',
        'permission_callback' => function () {
            return current_user_can('edit_users');
        },
        'args' => array(
            'id' => array(
                'validate_callback' => function ($param) {
                    return is_numeric($param);
                }
            ),
        ),
    ));

    // Endpoint para matricular usuario en curso (fallback para Tutor LMS)
    register_rest_route('custom/v1', '/enroll', array(
        'methods' => 'POST',
        'callback' => 'custom_enroll_user_in_course',
        'permission_callback' => function () {
            return current_user_can('edit_users');
        },
        'args' => array(
            'user_id' => array(
                'required' => true,
                'validate_callback' => function ($param) {
                    return is_numeric($param);
                }
            ),
            'course_id' => array(
                'required' => true,
                'validate_callback' => function ($param) {
                    return is_numeric($param);
                }
            ),
            'skip_order_check' => array(
                'required' => false,
                'sanitize_callback' => function ($param) {
                    return filter_var($param, FILTER_VALIDATE_BOOLEAN);
                }
            ),
        ),
    ));

    // Endpoint para matricular usuario en múltiples cursos (batch)
    register_rest_route('custom/v1', '/enroll-batch', array(
        'methods' => 'POST',
        'callback' => 'custom_enroll_user_in_courses_batch',
        'permission_callback' => function () {
            return current_user_can('edit_users');
        },
        'args' => array(
            'user_id' => array(
                'required' => true,
                'validate_callback' => function ($param) {
                    return is_numeric($param);
                }
            ),
            'course_ids' => array(
                'required' => true,
                'validate_callback' => function ($param) {
                    if (!is_array($param) || empty($param)) {
                        return false;
                    }

                    foreach ($param as $course_id) {
                        if (!is_numeric($course_id) || intval($course_id) <= 0) {
                            return false;
                        }
                    }

                    return true;
                }
            ),
            'skip_order_check' => array(
                'required' => false,
                'sanitize_callback' => function ($param) {
                    return filter_var($param, FILTER_VALIDATE_BOOLEAN);
                }
            ),
        ),
    ));

    // Endpoint para desmatricular usuario de curso (fallback para Tutor LMS)
    register_rest_route('custom/v1', '/unenroll', array(
        'methods' => 'POST',
        'callback' => 'custom_unenroll_user_from_course',
        'permission_callback' => function () {
            return current_user_can('edit_users');
        },
        'args' => array(
            'user_id' => array(
                'required' => true,
                'validate_callback' => function ($param) {
                    return is_numeric($param);
                }
            ),
            'course_id' => array(
                'required' => true,
                'validate_callback' => function ($param) {
                    return is_numeric($param);
                }
            ),
        ),
    ));
});

function custom_get_courses($request) {
    $page = max(1, intval($request->get_param('page') ?: 1));
    $per_page = max(1, min(100, intval($request->get_param('per_page') ?: 10)));
    $search = $request->get_param('search');
    $status = $request->get_param('status');

    $allowed_status = array('publish', 'draft', 'pending', 'private');
    $status_value = in_array($status, $allowed_status, true) ? $status : $allowed_status;

    $args = array(
        'post_type' => 'courses',
        'post_status' => $status_value,
        'posts_per_page' => $per_page,
        'paged' => $page,
        'orderby' => 'date',
        'order' => 'DESC',
    );

    if (!empty($search)) {
        $args['s'] = sanitize_text_field($search);
    }

    $query = new WP_Query($args);
    $courses = array();

    foreach ($query->posts as $course) {
        $course_id = intval($course->ID);
        $thumbnail_url = get_the_post_thumbnail_url($course_id, 'medium') ?: null;

        $courses[] = array(
            'id' => $course_id,
            'title' => array('rendered' => $course->post_title),
            'status' => $course->post_status,
            'link' => get_permalink($course_id),
            'date' => $course->post_date,
            'thumbnail' => $thumbnail_url,
            'author' => intval($course->post_author),
        );
    }

    return array(
        'courses' => $courses,
        'pagination' => array(
            'page' => $page,
            'per_page' => $per_page,
            'total' => intval($query->found_posts),
            'total_pages' => intval($query->max_num_pages),
        ),
    );
}

function custom_get_course($request) {
    $course_id = intval($request['id']);
    $course = get_post($course_id);

    if (!$course || $course->post_type !== 'courses') {
        return new WP_Error('course_not_found', 'Course not found', array('status' => 404));
    }

    $thumbnail_url = get_the_post_thumbnail_url($course_id, 'medium') ?: null;

    return array(
        'course' => array(
            'id' => $course_id,
            'title' => array('rendered' => $course->post_title),
            'status' => $course->post_status,
            'link' => get_permalink($course_id),
            'date' => $course->post_date,
            'thumbnail' => $thumbnail_url,
            'author' => intval($course->post_author),
        ),
    );
}

/**
 * Verifica si el usuario tiene orden válida para el curso.
 * Intenta mapear el curso a producto WooCommerce por meta común de Tutor.
 */
function custom_user_has_valid_order_for_course($user_id, $course_id) {
    if (!function_exists('wc_get_orders')) {
        return false;
    }

    $product_ids = array();
    $candidate_keys = array(
        '_tutor_course_product_id',
        '_tutor_product_id',
        '_tutor_wc_product_id',
        'product_id',
    );

    foreach ($candidate_keys as $key) {
        $value = intval(get_post_meta($course_id, $key, true));
        if ($value > 0) {
            $product_ids[] = $value;
        }
    }

    $product_ids = array_values(array_unique(array_filter($product_ids)));

    $orders = wc_get_orders(array(
        'customer_id' => $user_id,
        'status' => array('processing', 'completed'),
        'limit' => 100,
    ));

    if (empty($orders) || !is_array($orders)) {
        return false;
    }

    foreach ($orders as $order) {
        if (!is_object($order) || !method_exists($order, 'get_items')) {
            continue;
        }

        $items = $order->get_items();
        if (empty($items)) {
            continue;
        }

        // Si no hay mapeo producto-curso, al menos exige una orden pagada.
        if (empty($product_ids)) {
            return true;
        }

        foreach ($items as $item) {
            if (!is_object($item) || !method_exists($item, 'get_product_id')) {
                continue;
            }
            $item_product_id = intval($item->get_product_id());
            if (in_array($item_product_id, $product_ids, true)) {
                return true;
            }
        }
    }

    return false;
}

function custom_get_orders_admin_url($user_id) {
    return add_query_arg(
        array(
            'post_type' => 'shop_order',
            '_customer_user' => intval($user_id),
        ),
        admin_url('edit.php')
    );
}

function custom_build_enroll_error_data($result) {
    $data = array(
        'status' => isset($result['status']) ? intval($result['status']) : 500,
    );

    if (!empty($result['action_required'])) {
        $data['action_required'] = $result['action_required'];
    }

    if (!empty($result['orders_url'])) {
        $data['orders_url'] = $result['orders_url'];
    }

    return $data;
}

function custom_enroll_user_in_course_internal($user_id, $course_id, $skip_order_check = false) {
    global $wpdb;

    $user_id = intval($user_id);
    $course_id = intval($course_id);
    $skip_order_check = filter_var($skip_order_check, FILTER_VALIDATE_BOOLEAN);

    $user = get_user_by('ID', $user_id);
    if (!$user) {
        return array(
            'success' => false,
            'code' => 'user_not_found',
            'message' => 'User not found',
            'status' => 404,
        );
    }

    $course = get_post($course_id);
    if (!$course || $course->post_type !== 'courses') {
        return array(
            'success' => false,
            'code' => 'course_not_found',
            'message' => 'Course not found',
            'status' => 404,
        );
    }

    if (!$skip_order_check && !custom_user_has_valid_order_for_course($user_id, $course_id)) {
        return array(
            'success' => false,
            'code' => 'order_required',
            'message' => 'No hay una orden válida para autorizar la matrícula de este curso',
            'status' => 403,
            'action_required' => 'go_to_orders',
            'orders_url' => custom_get_orders_admin_url($user_id),
        );
    }

    $existing_enrollment_id = intval($wpdb->get_var($wpdb->prepare(
        "SELECT ID
         FROM {$wpdb->posts}
         WHERE post_type = 'tutor_enrolled'
         AND post_author = %d
         AND post_parent = %d
         AND post_status IN ('completed', 'publish', 'pending', 'private')
         LIMIT 1",
        $user_id,
        $course_id
    )));

    if ($existing_enrollment_id > 0) {
        return array(
            'success' => true,
            'message' => 'User already enrolled',
            'user_id' => $user_id,
            'course_id' => $course_id,
            'enrollment_id' => $existing_enrollment_id,
            'already_enrolled' => true,
        );
    }

    $enrollment_id = wp_insert_post(array(
        'post_type' => 'tutor_enrolled',
        'post_status' => 'completed',
        'post_author' => $user_id,
        'post_parent' => $course_id,
        'post_title' => sprintf('Enrollment #%d-%d', $user_id, $course_id),
    ), true);

    if (is_wp_error($enrollment_id)) {
        return array(
            'success' => false,
            'code' => 'enrollment_failed',
            'message' => $enrollment_id->get_error_message(),
            'status' => 500,
        );
    }

    update_post_meta($enrollment_id, '_tutor_enrolled_by', get_current_user_id());
    update_post_meta($enrollment_id, '_tutor_enrolled_at', current_time('mysql'));

    return array(
        'success' => true,
        'message' => 'User enrolled successfully',
        'user_id' => $user_id,
        'course_id' => $course_id,
        'enrollment_id' => intval($enrollment_id),
        'already_enrolled' => false,
    );
}

/**
 * Matricular usuario en curso (Tutor LMS fallback)
 */
function custom_enroll_user_in_course($request) {
    $user_id = intval($request->get_param('user_id'));
    $course_id = intval($request->get_param('course_id'));
    $skip_order_check = filter_var($request->get_param('skip_order_check'), FILTER_VALIDATE_BOOLEAN);

    $result = custom_enroll_user_in_course_internal($user_id, $course_id, $skip_order_check);

    if (empty($result['success'])) {
        return new WP_Error(
            $result['code'],
            $result['message'],
            custom_build_enroll_error_data($result)
        );
    }

    return $result;
}

function custom_enroll_user_in_courses_batch($request) {
    $user_id = intval($request->get_param('user_id'));
    $raw_course_ids = $request->get_param('course_ids');
    $skip_order_check = filter_var($request->get_param('skip_order_check'), FILTER_VALIDATE_BOOLEAN);

    if (!is_array($raw_course_ids) || empty($raw_course_ids)) {
        return new WP_Error('invalid_course_ids', 'course_ids must be a non-empty array', array('status' => 400));
    }

    $course_ids = array_values(array_unique(array_filter(array_map('intval', $raw_course_ids), function ($id) {
        return $id > 0;
    })));

    if (empty($course_ids)) {
        return new WP_Error('invalid_course_ids', 'course_ids must contain valid course ids', array('status' => 400));
    }

    $results = array();
    $enrolled = 0;
    $already_enrolled = 0;
    $failed = 0;
    $requires_order = false;
    $courses_requiring_order = array();
    $orders_url = custom_get_orders_admin_url($user_id);

    foreach ($course_ids as $course_id) {
        $result = custom_enroll_user_in_course_internal($user_id, $course_id, $skip_order_check);

        if (!empty($result['success'])) {
            if (!empty($result['already_enrolled'])) {
                $already_enrolled++;
            } else {
                $enrolled++;
            }

            $results[] = array(
                'course_id' => $course_id,
                'success' => true,
                'message' => $result['message'],
                'enrollment_id' => intval($result['enrollment_id']),
                'already_enrolled' => (bool) $result['already_enrolled'],
            );
            continue;
        }

        $failed++;
        $entry = array(
            'course_id' => $course_id,
            'success' => false,
            'code' => $result['code'],
            'message' => $result['message'],
            'status' => isset($result['status']) ? intval($result['status']) : 500,
        );

        if (!empty($result['action_required']) && !empty($result['orders_url'])) {
            $entry['action_required'] = $result['action_required'];
            $entry['orders_url'] = $result['orders_url'];
            $requires_order = true;
            $courses_requiring_order[] = $course_id;
        }

        $results[] = $entry;
    }

    $response = array(
        'success' => true,
        'user_id' => $user_id,
        'summary' => array(
            'requested' => count($course_ids),
            'enrolled' => $enrolled,
            'already_enrolled' => $already_enrolled,
            'failed' => $failed,
        ),
        'results' => $results,
    );

    if ($requires_order) {
        $response['action_required'] = 'go_to_orders';
        $response['orders_url'] = $orders_url;
        $response['courses_requiring_order'] = $courses_requiring_order;
    }

    return $response;
}

/**
 * Desmatricular usuario de curso (Tutor LMS fallback)
 */
function custom_unenroll_user_from_course($request) {
    global $wpdb;

    $user_id = intval($request->get_param('user_id'));
    $course_id = intval($request->get_param('course_id'));

    $user = get_user_by('ID', $user_id);
    if (!$user) {
        return new WP_Error('user_not_found', 'User not found', array('status' => 404));
    }

    $course = get_post($course_id);
    if (!$course || $course->post_type !== 'courses') {
        return new WP_Error('course_not_found', 'Course not found', array('status' => 404));
    }

    $enrollment_ids = $wpdb->get_col($wpdb->prepare(
        "SELECT ID
         FROM {$wpdb->posts}
         WHERE post_type = 'tutor_enrolled'
         AND post_author = %d
         AND post_parent = %d
         AND post_status IN ('completed', 'publish', 'pending', 'private')",
        $user_id,
        $course_id
    ));

    if (empty($enrollment_ids)) {
        return new WP_Error('enrollment_not_found', 'Enrollment not found', array('status' => 404));
    }

    $deleted = 0;
    foreach ($enrollment_ids as $enrollment_id) {
        $result = wp_delete_post(intval($enrollment_id), true);
        if ($result) {
            $deleted++;
        }
    }

    return array(
        'success' => true,
        'message' => 'User unenrolled successfully',
        'user_id' => $user_id,
        'course_id' => $course_id,
        'deleted_enrollments' => $deleted,
    );
}

/**
 * Suspend a user
 */
function custom_suspend_user($request) {
    $user_id = $request['id'];
    $reason = $request->get_param('reason') ?: 'No reason provided';

    // Verify user exists
    $user = get_user_by('ID', $user_id);
    if (!$user) {
        return new WP_Error('user_not_found', 'User not found', array('status' => 404));
    }

    // Don't allow suspending administrators
    if (in_array('administrator', $user->roles)) {
        return new WP_Error('cannot_suspend_admin', 'Cannot suspend administrator users', array('status' => 403));
    }

    // Set user meta to mark as suspended
    update_user_meta($user_id, 'account_suspended', true);
    update_user_meta($user_id, 'suspension_reason', $reason);
    update_user_meta($user_id, 'suspended_at', current_time('mysql'));
    update_user_meta($user_id, 'suspended_by', get_current_user_id());

    // Destroy all sessions for this user (log them out)
    $sessions = WP_Session_Tokens::get_instance($user_id);
    $sessions->destroy_all();

    return array(
        'success' => true,
        'message' => 'User suspended successfully',
        'user_id' => $user_id,
        'suspended' => true,
        'reason' => $reason,
    );
}

/**
 * Unsuspend a user
 */
function custom_unsuspend_user($request) {
    $user_id = $request['id'];

    // Verify user exists
    $user = get_user_by('ID', $user_id);
    if (!$user) {
        return new WP_Error('user_not_found', 'User not found', array('status' => 404));
    }

    // Remove suspension meta
    delete_user_meta($user_id, 'account_suspended');
    delete_user_meta($user_id, 'suspension_reason');
    delete_user_meta($user_id, 'suspended_at');
    delete_user_meta($user_id, 'suspended_by');

    return array(
        'success' => true,
        'message' => 'User unsuspended successfully',
        'user_id' => $user_id,
        'suspended' => false,
    );
}

/**
 * Get suspension status
 */
function custom_get_suspension_status($request) {
    $user_id = $request['id'];

    // Verify user exists
    $user = get_user_by('ID', $user_id);
    if (!$user) {
        return new WP_Error('user_not_found', 'User not found', array('status' => 404));
    }

    $is_suspended = get_user_meta($user_id, 'account_suspended', true);

    return array(
        'user_id' => $user_id,
        'suspended' => (bool) $is_suspended,
        'reason' => $is_suspended ? get_user_meta($user_id, 'suspension_reason', true) : null,
        'suspended_at' => $is_suspended ? get_user_meta($user_id, 'suspended_at', true) : null,
        'suspended_by' => $is_suspended ? get_user_meta($user_id, 'suspended_by', true) : null,
    );
}

function custom_normalize_user_ids($raw_user_ids) {
    if (!is_array($raw_user_ids) || empty($raw_user_ids)) {
        return array();
    }

    return array_values(array_unique(array_filter(array_map('intval', $raw_user_ids), function ($id) {
        return $id > 0;
    })));
}

function custom_build_batch_summary($requested, $results) {
    $successful = 0;
    $failed = 0;

    foreach ($results as $item) {
        if (!empty($item['success'])) {
            $successful++;
        } else {
            $failed++;
        }
    }

    return array(
        'requested' => intval($requested),
        'successful' => $successful,
        'failed' => $failed,
    );
}

function custom_suspend_user_by_id($user_id, $reason = '') {
    $user_id = intval($user_id);
    $reason = !empty($reason) ? sanitize_textarea_field($reason) : 'No reason provided';

    $user = get_user_by('ID', $user_id);
    if (!$user) {
        return array(
            'success' => false,
            'code' => 'user_not_found',
            'message' => 'User not found',
            'status' => 404,
        );
    }

    if (in_array('administrator', $user->roles, true)) {
        return array(
            'success' => false,
            'code' => 'cannot_suspend_admin',
            'message' => 'Cannot suspend administrator users',
            'status' => 403,
        );
    }

    update_user_meta($user_id, 'account_suspended', true);
    update_user_meta($user_id, 'suspension_reason', $reason);
    update_user_meta($user_id, 'suspended_at', current_time('mysql'));
    update_user_meta($user_id, 'suspended_by', get_current_user_id());

    $sessions = WP_Session_Tokens::get_instance($user_id);
    if ($sessions) {
        $sessions->destroy_all();
    }

    return array(
        'success' => true,
        'message' => 'User suspended successfully',
        'user_id' => $user_id,
        'reason' => $reason,
    );
}

function custom_unsuspend_user_by_id($user_id) {
    $user_id = intval($user_id);
    $user = get_user_by('ID', $user_id);

    if (!$user) {
        return array(
            'success' => false,
            'code' => 'user_not_found',
            'message' => 'User not found',
            'status' => 404,
        );
    }

    delete_user_meta($user_id, 'account_suspended');
    delete_user_meta($user_id, 'suspension_reason');
    delete_user_meta($user_id, 'suspended_at');
    delete_user_meta($user_id, 'suspended_by');

    return array(
        'success' => true,
        'message' => 'User unsuspended successfully',
        'user_id' => $user_id,
    );
}

function custom_delete_user_by_id($user_id, $reassign = 0) {
    $user_id = intval($user_id);
    $reassign = intval($reassign);
    $user = get_user_by('ID', $user_id);

    if (!$user) {
        return array(
            'success' => false,
            'code' => 'user_not_found',
            'message' => 'User not found',
            'status' => 404,
        );
    }

    if (in_array('administrator', $user->roles, true)) {
        return array(
            'success' => false,
            'code' => 'cannot_delete_admin',
            'message' => 'Cannot delete administrator users',
            'status' => 403,
        );
    }

    if (get_current_user_id() === $user_id) {
        return array(
            'success' => false,
            'code' => 'cannot_delete_current_user',
            'message' => 'Cannot delete the current user',
            'status' => 403,
        );
    }

    if ($reassign > 0 && $reassign === $user_id) {
        return array(
            'success' => false,
            'code' => 'invalid_reassign_user',
            'message' => 'Reassign user cannot be the same as the deleted user',
            'status' => 400,
        );
    }

    if (!function_exists('wp_delete_user')) {
        require_once ABSPATH . 'wp-admin/includes/user.php';
    }

    $deleted = wp_delete_user($user_id, $reassign > 0 ? $reassign : null);
    if (!$deleted) {
        return array(
            'success' => false,
            'code' => 'delete_failed',
            'message' => 'Could not delete user',
            'status' => 500,
        );
    }

    return array(
        'success' => true,
        'message' => 'User deleted successfully',
        'user_id' => $user_id,
    );
}

function custom_create_single_user($payload) {
    if (!is_array($payload)) {
        return array(
            'success' => false,
            'code' => 'invalid_payload',
            'message' => 'Each item in users must be an object',
            'status' => 400,
        );
    }

    $raw_username = isset($payload['username']) ? $payload['username'] : '';
    $raw_email = isset($payload['email']) ? $payload['email'] : '';
    $raw_password = isset($payload['password']) ? $payload['password'] : '';
    $raw_role = isset($payload['role']) ? $payload['role'] : 'subscriber';

    $username = sanitize_user($raw_username, true);
    $email = sanitize_email($raw_email);
    $role = sanitize_key($raw_role ?: 'subscriber');

    if (empty($username)) {
        return array(
            'success' => false,
            'code' => 'invalid_username',
            'message' => 'username is required',
            'status' => 400,
        );
    }

    if (empty($email) || !is_email($email)) {
        return array(
            'success' => false,
            'code' => 'invalid_email',
            'message' => 'A valid email is required',
            'status' => 400,
        );
    }

    if (username_exists($username)) {
        return array(
            'success' => false,
            'code' => 'username_exists',
            'message' => 'Username already exists',
            'status' => 409,
        );
    }

    if (email_exists($email)) {
        return array(
            'success' => false,
            'code' => 'email_exists',
            'message' => 'Email already exists',
            'status' => 409,
        );
    }

    $roles = wp_roles();
    if (!$roles || !isset($roles->roles[$role])) {
        return array(
            'success' => false,
            'code' => 'invalid_role',
            'message' => 'Role is not valid',
            'status' => 400,
        );
    }

    $password_generated = false;
    $password = is_string($raw_password) ? trim($raw_password) : '';
    if ($password === '') {
        $password = wp_generate_password(20, true, true);
        $password_generated = true;
    }

    $user_data = array(
        'user_login' => $username,
        'user_pass' => $password,
        'user_email' => $email,
        'first_name' => isset($payload['first_name']) ? sanitize_text_field($payload['first_name']) : '',
        'last_name' => isset($payload['last_name']) ? sanitize_text_field($payload['last_name']) : '',
        'display_name' => isset($payload['display_name']) ? sanitize_text_field($payload['display_name']) : '',
        'role' => $role,
    );

    if (empty($user_data['display_name'])) {
        $user_data['display_name'] = trim($user_data['first_name'] . ' ' . $user_data['last_name']);
    }

    $new_user_id = wp_insert_user($user_data);
    if (is_wp_error($new_user_id)) {
        return array(
            'success' => false,
            'code' => 'create_user_failed',
            'message' => $new_user_id->get_error_message(),
            'status' => 500,
        );
    }

    $result = array(
        'success' => true,
        'message' => 'User created successfully',
        'user_id' => intval($new_user_id),
        'username' => $username,
        'email' => $email,
        'role' => $role,
    );

    if ($password_generated) {
        $result['generated_password'] = $password;
    }

    return $result;
}

function custom_suspend_users_batch($request) {
    $user_ids = custom_normalize_user_ids($request->get_param('user_ids'));
    $reason = $request->get_param('reason');

    if (empty($user_ids)) {
        return new WP_Error('invalid_user_ids', 'user_ids must be a non-empty array', array('status' => 400));
    }

    $results = array();
    foreach ($user_ids as $user_id) {
        $result = custom_suspend_user_by_id($user_id, $reason);
        $results[] = array(
            'user_id' => $user_id,
            'success' => !empty($result['success']),
            'code' => !empty($result['code']) ? $result['code'] : null,
            'message' => $result['message'],
            'status' => !empty($result['status']) ? intval($result['status']) : 200,
        );
    }

    return array(
        'success' => true,
        'summary' => custom_build_batch_summary(count($user_ids), $results),
        'results' => $results,
    );
}

function custom_unsuspend_users_batch($request) {
    $user_ids = custom_normalize_user_ids($request->get_param('user_ids'));

    if (empty($user_ids)) {
        return new WP_Error('invalid_user_ids', 'user_ids must be a non-empty array', array('status' => 400));
    }

    $results = array();
    foreach ($user_ids as $user_id) {
        $result = custom_unsuspend_user_by_id($user_id);
        $results[] = array(
            'user_id' => $user_id,
            'success' => !empty($result['success']),
            'code' => !empty($result['code']) ? $result['code'] : null,
            'message' => $result['message'],
            'status' => !empty($result['status']) ? intval($result['status']) : 200,
        );
    }

    return array(
        'success' => true,
        'summary' => custom_build_batch_summary(count($user_ids), $results),
        'results' => $results,
    );
}

function custom_delete_users_batch($request) {
    $user_ids = custom_normalize_user_ids($request->get_param('user_ids'));
    $reassign = intval($request->get_param('reassign'));

    if (empty($user_ids)) {
        return new WP_Error('invalid_user_ids', 'user_ids must be a non-empty array', array('status' => 400));
    }

    if ($reassign > 0 && in_array($reassign, $user_ids, true)) {
        return new WP_Error('invalid_reassign_user', 'reassign user cannot be in user_ids', array('status' => 400));
    }

    if ($reassign > 0 && !get_user_by('ID', $reassign)) {
        return new WP_Error('reassign_user_not_found', 'Reassign user not found', array('status' => 404));
    }

    $results = array();
    foreach ($user_ids as $user_id) {
        $result = custom_delete_user_by_id($user_id, $reassign);
        $results[] = array(
            'user_id' => $user_id,
            'success' => !empty($result['success']),
            'code' => !empty($result['code']) ? $result['code'] : null,
            'message' => $result['message'],
            'status' => !empty($result['status']) ? intval($result['status']) : 200,
        );
    }

    return array(
        'success' => true,
        'summary' => custom_build_batch_summary(count($user_ids), $results),
        'results' => $results,
    );
}

function custom_create_users_batch($request) {
    $users = $request->get_param('users');
    if (!is_array($users) || empty($users)) {
        return new WP_Error('invalid_users', 'users must be a non-empty array', array('status' => 400));
    }

    $results = array();
    $index = 0;
    foreach ($users as $payload) {
        $index++;
        $result = custom_create_single_user($payload);

        $entry = array(
            'index' => $index,
            'success' => !empty($result['success']),
            'code' => !empty($result['code']) ? $result['code'] : null,
            'message' => $result['message'],
            'status' => !empty($result['status']) ? intval($result['status']) : 201,
        );

        if (!empty($result['success'])) {
            $entry['user_id'] = intval($result['user_id']);
            $entry['username'] = $result['username'];
            $entry['email'] = $result['email'];
            $entry['role'] = $result['role'];
            if (!empty($result['generated_password'])) {
                $entry['generated_password'] = $result['generated_password'];
            }
        }

        $results[] = $entry;
    }

    return array(
        'success' => true,
        'summary' => custom_build_batch_summary(count($users), $results),
        'results' => $results,
    );
}

/**
 * Prevent suspended users from logging in
 */
add_filter('wp_authenticate_user', function ($user) {
    if (is_wp_error($user)) {
        return $user;
    }

    $is_suspended = get_user_meta($user->ID, 'account_suspended', true);

    if ($is_suspended) {
        $reason = get_user_meta($user->ID, 'suspension_reason', true);
        $message = 'Tu cuenta ha sido suspendida.';

        if ($reason) {
            $message .= ' Razón: ' . esc_html($reason);
        }

        return new WP_Error('account_suspended', $message);
    }

    return $user;
}, 30, 1);

/**
 * Get enrolled courses for a user (Tutor LMS)
 */
add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/users/(?P<id>\d+)/courses', array(
        'methods' => 'GET',
        'callback' => 'custom_get_user_courses',
        'permission_callback' => function () {
            return current_user_can('edit_users');
        },
        'args' => array(
            'id' => array(
                'validate_callback' => function ($param) {
                    return is_numeric($param);
                }
            ),
        ),
    ));
});

function custom_get_user_courses($request) {
    global $wpdb;
    $user_id = intval($request['id']);

    $user = get_user_by('ID', $user_id);
    if (!$user) {
        return new WP_Error('user_not_found', 'User not found', array('status' => 404));
    }

    $course_map = array();

    // 1) Cursos inscritos (estudiante)
    $enrollments = $wpdb->get_results($wpdb->prepare(
        "SELECT p.post_parent as course_id, p.post_date as relation_date
         FROM {$wpdb->posts} p
         WHERE p.post_type = 'tutor_enrolled'
         AND p.post_author = %d
         AND p.post_status = 'completed'
         ORDER BY p.post_date DESC",
        $user_id
    ));

    foreach ($enrollments as $enrollment) {
        $course_id = intval($enrollment->course_id);
        if (!isset($course_map[$course_id])) {
            $course_map[$course_id] = array(
                'course_id' => $course_id,
                'date' => $enrollment->relation_date,
                'relations' => array('enrolled'),
            );
        }
    }

    // 2) Cursos donde es autor en WordPress
    $authored_courses = get_posts(array(
        'post_type' => 'courses',
        'post_status' => array('publish', 'draft', 'pending', 'private'),
        'author' => $user_id,
        'numberposts' => -1,
        'fields' => 'ids',
    ));

    foreach ($authored_courses as $course_id) {
        $course = get_post($course_id);
        if (!$course) {
            continue;
        }

        if (!isset($course_map[$course_id])) {
            $course_map[$course_id] = array(
                'course_id' => $course_id,
                'date' => $course->post_date,
                'relations' => array('author'),
            );
        } elseif (!in_array('author', $course_map[$course_id]['relations'], true)) {
            $course_map[$course_id]['relations'][] = 'author';
        }
    }

    // 3) Cursos donde aparece como instructor ligado (Tutor LMS)
    if (function_exists('tutor_utils')) {
        $all_course_ids = get_posts(array(
            'post_type' => 'courses',
            'post_status' => array('publish', 'draft', 'pending', 'private'),
            'numberposts' => -1,
            'fields' => 'ids',
        ));

        foreach ($all_course_ids as $course_id) {
            $instructors = tutor_utils()->get_instructors_by_course($course_id);
            if (empty($instructors) || !is_array($instructors)) {
                continue;
            }

            $is_linked = false;
            foreach ($instructors as $instructor) {
                $instructor_id = 0;
                if (is_object($instructor) && isset($instructor->ID)) {
                    $instructor_id = intval($instructor->ID);
                } elseif (is_array($instructor) && isset($instructor['ID'])) {
                    $instructor_id = intval($instructor['ID']);
                } elseif (is_numeric($instructor)) {
                    $instructor_id = intval($instructor);
                }

                if ($instructor_id === $user_id) {
                    $is_linked = true;
                    break;
                }
            }

            if (!$is_linked) {
                continue;
            }

            $course = get_post($course_id);
            if (!$course) {
                continue;
            }

            if (!isset($course_map[$course_id])) {
                $course_map[$course_id] = array(
                    'course_id' => $course_id,
                    'date' => $course->post_date,
                    'relations' => array('instructor'),
                );
            } elseif (!in_array('instructor', $course_map[$course_id]['relations'], true)) {
                $course_map[$course_id]['relations'][] = 'instructor';
            }
        }
    }

    if (empty($course_map)) {
        return array('courses' => array());
    }

    $courses = array();
    foreach ($course_map as $item) {
        $course_id = intval($item['course_id']);
        $course = get_post($course_id);
        if (!$course) {
            continue;
        }

        $thumbnail_url = get_the_post_thumbnail_url($course_id, 'medium') ?: null;

        $courses[] = array(
            'id' => $course_id,
            'title' => array('rendered' => $course->post_title),
            'status' => $course->post_status,
            'link' => get_permalink($course_id),
            'date' => $item['date'],
            'thumbnail' => $thumbnail_url,
            'relations' => $item['relations'],
        );
    }

    usort($courses, function ($a, $b) {
        $da = strtotime($a['date']);
        $db = strtotime($b['date']);
        return $db <=> $da;
    });

    return array('courses' => $courses);
}

/**
 * Add suspension info to user REST API response
 */
add_filter('rest_prepare_user', function ($response, $user) {
    $is_suspended = get_user_meta($user->ID, 'account_suspended', true);

    $response->data['is_suspended'] = (bool) $is_suspended;

    if ($is_suspended) {
        $response->data['suspension_reason'] = get_user_meta($user->ID, 'suspension_reason', true);
        $response->data['suspended_at'] = get_user_meta($user->ID, 'suspended_at', true);
    }

    return $response;
}, 10, 2);

/**
 * Admin view for batch user operations.
 */
add_action('admin_menu', function () {
    add_users_page(
        'LIQ Gestión Masiva',
        'LIQ Gestión Masiva',
        'edit_users',
        'liq-batch-users',
        'custom_render_liq_batch_users_admin_page'
    );
});

function custom_render_liq_batch_users_admin_page() {
    if (!current_user_can('edit_users')) {
        wp_die('You do not have permission to access this page.');
    }

    $rest_root = esc_url_raw(rest_url('custom/v1/'));
    $rest_nonce = wp_create_nonce('wp_rest');
    ?>
    <div class="wrap">
        <h1>LIQ Gestión Masiva de Usuarios</h1>
        <p>Ejecuta operaciones por lote para ahorrar tiempo.</p>

        <div style="background:#fff;border:1px solid #ccd0d4;padding:16px;margin:16px 0;">
            <h2>1) Suspender usuarios</h2>
            <p>IDs separados por coma. Ejemplo: 12,15,20</p>
            <input type="text" id="liq_suspend_ids" class="regular-text" style="width:100%;max-width:700px;" />
            <p>Razón (opcional)</p>
            <textarea id="liq_suspend_reason" rows="3" style="width:100%;max-width:700px;"></textarea>
            <p><button class="button button-primary" id="liq_suspend_btn">Suspender en lote</button></p>
        </div>

        <div style="background:#fff;border:1px solid #ccd0d4;padding:16px;margin:16px 0;">
            <h2>2) Habilitar usuarios</h2>
            <p>IDs separados por coma. Ejemplo: 12,15,20</p>
            <input type="text" id="liq_unsuspend_ids" class="regular-text" style="width:100%;max-width:700px;" />
            <p><button class="button button-primary" id="liq_unsuspend_btn">Habilitar en lote</button></p>
        </div>

        <div style="background:#fff;border:1px solid #ccd0d4;padding:16px;margin:16px 0;">
            <h2>3) Eliminar usuarios</h2>
            <p>IDs separados por coma. Ejemplo: 12,15,20</p>
            <input type="text" id="liq_delete_ids" class="regular-text" style="width:100%;max-width:700px;" />
            <p>ID de reasignación (opcional)</p>
            <input type="number" id="liq_delete_reassign" class="small-text" min="1" />
            <p><button class="button button-primary" id="liq_delete_btn">Eliminar en lote</button></p>
        </div>

        <div style="background:#fff;border:1px solid #ccd0d4;padding:16px;margin:16px 0;">
            <h2>4) Crear usuarios en lote</h2>
            <p>Formato CSV (una línea por usuario):</p>
            <code>username,email,role,first_name,last_name,password(opcional)</code>
            <textarea id="liq_create_rows" rows="8" style="width:100%;max-width:900px;"></textarea>
            <p><button class="button button-primary" id="liq_create_btn">Crear usuarios en lote</button></p>
        </div>

        <div style="background:#fff;border:1px solid #ccd0d4;padding:16px;margin:16px 0;">
            <h2>Resultado</h2>
            <pre id="liq_batch_result" style="white-space:pre-wrap;max-height:420px;overflow:auto;"></pre>
        </div>
    </div>

    <script>
    (function() {
        const REST_ROOT = <?php echo wp_json_encode($rest_root); ?>;
        const REST_NONCE = <?php echo wp_json_encode($rest_nonce); ?>;
        const resultBox = document.getElementById('liq_batch_result');

        function parseIds(value) {
            if (!value) return [];
            return value
                .split(',')
                .map(function(item) { return parseInt(item.trim(), 10); })
                .filter(function(id) { return Number.isInteger(id) && id > 0; });
        }

        async function callBatch(endpoint, payload) {
            resultBox.textContent = 'Procesando...';
            try {
                const response = await fetch(REST_ROOT + endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': REST_NONCE
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                resultBox.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                resultBox.textContent = 'Error de red: ' + (error && error.message ? error.message : 'unknown');
            }
        }

        document.getElementById('liq_suspend_btn').addEventListener('click', function() {
            const userIds = parseIds(document.getElementById('liq_suspend_ids').value);
            const reason = document.getElementById('liq_suspend_reason').value.trim();
            if (!userIds.length) {
                resultBox.textContent = 'Debes capturar al menos un ID válido.';
                return;
            }
            callBatch('users/batch/suspend', { user_ids: userIds, reason: reason });
        });

        document.getElementById('liq_unsuspend_btn').addEventListener('click', function() {
            const userIds = parseIds(document.getElementById('liq_unsuspend_ids').value);
            if (!userIds.length) {
                resultBox.textContent = 'Debes capturar al menos un ID válido.';
                return;
            }
            callBatch('users/batch/unsuspend', { user_ids: userIds });
        });

        document.getElementById('liq_delete_btn').addEventListener('click', function() {
            const userIds = parseIds(document.getElementById('liq_delete_ids').value);
            const reassignRaw = parseInt(document.getElementById('liq_delete_reassign').value, 10);
            if (!userIds.length) {
                resultBox.textContent = 'Debes capturar al menos un ID válido.';
                return;
            }

            const payload = { user_ids: userIds };
            if (Number.isInteger(reassignRaw) && reassignRaw > 0) {
                payload.reassign = reassignRaw;
            }
            callBatch('users/batch/delete', payload);
        });

        document.getElementById('liq_create_btn').addEventListener('click', function() {
            const rows = document.getElementById('liq_create_rows').value
                .split(/\r?\n/)
                .map(function(line) { return line.trim(); })
                .filter(function(line) { return line.length > 0; });

            if (!rows.length) {
                resultBox.textContent = 'Debes capturar al menos una fila.';
                return;
            }

            const users = [];
            for (let i = 0; i < rows.length; i++) {
                const cols = rows[i].split(',').map(function(v) { return v.trim(); });
                if (cols.length < 3) {
                    resultBox.textContent = 'Fila ' + (i + 1) + ' inválida. Usa: username,email,role,first_name,last_name,password(opcional)';
                    return;
                }

                const user = {
                    username: cols[0] || '',
                    email: cols[1] || '',
                    role: cols[2] || 'subscriber',
                    first_name: cols[3] || '',
                    last_name: cols[4] || ''
                };

                if (cols[5]) {
                    user.password = cols[5];
                }

                users.push(user);
            }

            callBatch('users/batch/create', { users: users });
        });
    })();
    </script>
    <?php
}
