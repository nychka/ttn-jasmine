class MomentaController < ApplicationController
  before_action :set_momentum, only: [:show, :edit, :update, :destroy]

  # GET /momenta
  # GET /momenta.json
  def index
   @cdn = 'https://avia.tickets.ru.default.staging.ttndev.com'
  end

  # GET /momenta/1
  # GET /momenta/1.json
  def show
  end

  # GET /momenta/new
  def new
    @momentum = Momentum.new
  end

  # GET /momenta/1/edit
  def edit
  end

  # POST /momenta
  # POST /momenta.json
  def create
    @momentum = Momentum.new(momentum_params)

    respond_to do |format|
      if @momentum.save
        format.html { redirect_to @momentum, notice: 'Momentum was successfully created.' }
        format.json { render :show, status: :created, location: @momentum }
      else
        format.html { render :new }
        format.json { render json: @momentum.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /momenta/1
  # PATCH/PUT /momenta/1.json
  def update
    respond_to do |format|
      if @momentum.update(momentum_params)
        format.html { redirect_to @momentum, notice: 'Momentum was successfully updated.' }
        format.json { render :show, status: :ok, location: @momentum }
      else
        format.html { render :edit }
        format.json { render json: @momentum.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /momenta/1
  # DELETE /momenta/1.json
  def destroy
    @momentum.destroy
    respond_to do |format|
      format.html { redirect_to momenta_url, notice: 'Momentum was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_momentum
      @momentum = Momentum.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def momentum_params
      params.fetch(:momentum, {})
    end
end
