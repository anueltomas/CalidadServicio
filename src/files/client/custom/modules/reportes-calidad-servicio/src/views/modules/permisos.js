define("reportes-calidad-servicio:views/modules/permisos", [], function () {
    var PermisosManager = function (view) {
        this.view = view;
        this.permisos = {
            esAdministrativo: false,
            esCasaNacional: false,
            esGerente: false,
            esDirector: false,
            esCoordinador: false,
            esAfiliado: false,
            esAsesorRegular: false,
            puedeImportar: false,
            claUsuario: null,
            oficinaUsuario: null,
            usuarioId: null,
            permisosListo: false,
        };
    };

    PermisosManager.prototype.cargarPermisosUsuario = function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            var user = self.view.getUser();

            // ✅ USAR NUEVO ENDPOINT OPTIMIZADO
            Espo.Ajax.getRequest("CCustomerSurvey/action/getUserInfo", {
                userId: user.id,
            })
                .then(function (response) {
                    if (response.success && response.data) {
                        var userInfo = response.data;

                        self.permisos = {
                            esAdministrativo:
                                userInfo.esAdministrativo || false,
                            esCasaNacional: userInfo.esCasaNacional || false,
                            esGerente: userInfo.esGerente || false,
                            esDirector: userInfo.esDirector || false,
                            esCoordinador: userInfo.esCoordinador || false,
                            esAfiliado: userInfo.esAfiliado || false,
                            esAsesorRegular: userInfo.esAsesorRegular || false,
                            puedeImportar: userInfo.puedeImportar || false,
                            claUsuario: userInfo.claUsuario || null,
                            oficinaUsuario: userInfo.oficinaUsuario || null,
                            usuarioId: userInfo.usuarioId || user.id,
                            permisosListo: true,
                        };

                        console.log(
                            "🔐 Permisos cargados desde backend:",
                            self.permisos
                        );
                        self.aplicarRestriccionesUI();
                        resolve(self.permisos);
                    } else {
                        reject(
                            response.error ||
                                "Error al cargar permisos del usuario"
                        );
                    }
                })
                .catch(function (error) {
                    console.error("❌ Error cargando permisos:", error);
                    reject(error);
                });
        });
    };

    PermisosManager.prototype.aplicarRestriccionesUI = function () {
        if (!this.view.$el) return;

        var fileSection = this.view.$el.find(".file-input-section");
        if (fileSection.length) {
            if (!this.permisos.puedeImportar) {
                fileSection.hide();
            } else {
                fileSection.show();
            }
        }
    };

    PermisosManager.prototype.getPermisos = function () {
        return this.permisos;
    };

    // ✅ MÉTODOS DE PERMISO (igual que antes)
    PermisosManager.prototype.puedeVerTerritorioNacional = function () {
        return (
            this.permisos.esAdministrativo ||
            this.permisos.esCasaNacional ||
            this.permisos.esGerente ||
            this.permisos.esDirector ||
            this.permisos.esCoordinador ||
            this.permisos.esAfiliado
        );
    };

    PermisosManager.prototype.puedeVerTodosCLAs = function () {
        return this.permisos.esAdministrativo || this.permisos.esCasaNacional;
    };

    PermisosManager.prototype.puedeVerTodasOficinas = function () {
        return this.permisos.esAdministrativo || this.permisos.esCasaNacional;
    };

    PermisosManager.prototype.puedeVerComparacionOficinas = function () {
        return (
            this.permisos.esAdministrativo ||
            this.permisos.esCasaNacional ||
            this.permisos.esGerente ||
            this.permisos.esDirector ||
            this.permisos.esCoordinador ||
            this.permisos.esAfiliado
        );
    };

    PermisosManager.prototype.puedeVerComparacionAsesores = function () {
        return (
            this.permisos.esAdministrativo ||
            this.permisos.esCasaNacional ||
            this.permisos.esGerente ||
            this.permisos.esDirector ||
            this.permisos.esCoordinador ||
            this.permisos.esAfiliado ||
            this.permisos.esAsesorRegular
        );
    };

    PermisosManager.prototype.puedeVerDetalleAsesor = function (asesorId) {
        // Si es asesor regular, solo puede ver su propio detalle
        if (this.permisos.esAsesorRegular) {
            return asesorId === this.permisos.usuarioId;
        }

        // Los demás roles pueden ver cualquier asesor de su equipo/oficina
        return (
            this.permisos.esAdministrativo ||
            this.permisos.esCasaNacional ||
            this.permisos.esGerente ||
            this.permisos.esDirector ||
            this.permisos.esCoordinador ||
            this.permisos.esAfiliado
        );
    };

    PermisosManager.prototype.getCLAPermitido = function () {
        // Retorna el CLA que el usuario puede ver
        if (this.permisos.esAdministrativo || this.permisos.esCasaNacional) {
            return null; // Puede ver todos
        }
        return this.permisos.claUsuario;
    };

    PermisosManager.prototype.getOficinaPermitida = function () {
        // Retorna la oficina que el usuario puede ver
        if (this.permisos.esAdministrativo || this.permisos.esCasaNacional) {
            return null; // Puede ver todas
        }
        return this.permisos.oficinaUsuario;
    };

    return PermisosManager;
});
