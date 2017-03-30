require 'test_helper'

class MomentaControllerTest < ActionController::TestCase
  setup do
    @momentum = momenta(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:momenta)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create momentum" do
    assert_difference('Momentum.count') do
      post :create, momentum: {  }
    end

    assert_redirected_to momentum_path(assigns(:momentum))
  end

  test "should show momentum" do
    get :show, id: @momentum
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @momentum
    assert_response :success
  end

  test "should update momentum" do
    patch :update, id: @momentum, momentum: {  }
    assert_redirected_to momentum_path(assigns(:momentum))
  end

  test "should destroy momentum" do
    assert_difference('Momentum.count', -1) do
      delete :destroy, id: @momentum
    end

    assert_redirected_to momenta_path
  end
end
