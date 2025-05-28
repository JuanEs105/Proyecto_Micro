<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('retrospectivas', function (Blueprint $table) {
        $table->id();
        $table->string('equipo');
        $table->date('fecha');
        $table->text('mejorar')->nullable();
        $table->text('mantener')->nullable();
        $table->text('acciones')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('retrospectivas');
    }
};
