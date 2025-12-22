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

            Espo.Ajax.getRequest("CCustomerSurvey/action/getUserInfo", {
                userId: user.id,
            })
                .then(function (response) {
                    if (response.success && response.data) {
                        var userInfo = response.data;

                        const esAdminType = userInfo.userType === "admin";

                        const tieneRolesGestion =
                            userInfo.esGerente ||
                            userInfo.esCoordinador ||
                            userInfo.esDirector ||
                            userInfo.esAfiliado ||
                            userInfo.esCasaNacional;

                        const esAsesorRegularPuro =
                            userInfo.userType === "regular" &&
                            !tieneRolesGestion;

                        self.permisos = {
                            esAdministrativo: esAdminType,
                            esCasaNacional: userInfo.esCasaNacional || false,
                            esGerente: userInfo.esGerente || false,
                            esDirector: userInfo.esDirector || false,
                            esCoordinador: userInfo.esCoordinador || false,
                            esAfiliado: userInfo.esAfiliado || false,
                            esAsesorRegular: esAsesorRegularPuro,
                            puedeImportar: esAdminType,
                            claUsuario: userInfo.claUsuario || null,
                            oficinaUsuario: userInfo.oficinaUsuario || null,
                            usuarioId: userInfo.usuarioId || user.id,
                            permisosListo: true,
                        };

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
                    reject(error);
                });
        });
    };

    PermisosManager.prototype.aplicarRestriccionesUI = function () {
        if (!this.view.$el) return;

        var fileSection = this.view.$el.find(".file-input-section");
        var importButton = this.view.$el.find('[data-action="import"]');

        if (fileSection.length) {
            if (!this.permisos.puedeImportar) {
                fileSection.hide();
            } else {
                fileSection.show();
            }
        }

        if (importButton.length) {
            if (!this.permisos.puedeImportar) {
                importButton.hide();
            } else {
                importButton.show();
            }
        }

        var btnCompararOficinas = this.view.$el.find("#btn-comparar-oficinas");
        var btnCompararAsesores = this.view.$el.find("#btn-comparar-asesores");

        if (btnCompararOficinas.length && !this.puedeVerComparacionOficinas()) {
            btnCompararOficinas.hide();
        }

        if (btnCompararAsesores.length && !this.puedeVerComparacionAsesores()) {
            btnCompararAsesores.hide();
        }
    };

    PermisosManager.prototype.getPermisos = function () {
        return this.permisos;
    };

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
        if (this.permisos.esAsesorRegular) {
            return asesorId === this.permisos.usuarioId;
        }

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
        if (this.permisos.esAdministrativo || this.permisos.esCasaNacional) {
            return null;
        }
        return this.permisos.claUsuario;
    };

    PermisosManager.prototype.getOficinaPermitida = function () {
        if (this.permisos.esAdministrativo || this.permisos.esCasaNacional) {
            return null;
        }
        return this.permisos.oficinaUsuario;
    };

    PermisosManager.prototype.puedeVerTodasLasOficinas = function () {
        return (
            this.permisos.esAdministrativo ||
            this.permisos.esCasaNacional ||
            this.permisos.esGerente ||
            this.permisos.esDirector ||
            this.permisos.esCoordinador ||
            this.permisos.esAfiliado
        );
    };

    PermisosManager.prototype.puedeVerTodosLosAsesores = function () {
        return (
            this.permisos.esAdministrativo ||
            this.permisos.esCasaNacional ||
            this.permisos.esGerente ||
            this.permisos.esDirector ||
            this.permisos.esCoordinador ||
            this.permisos.esAfiliado
        );
    };

    return PermisosManager;
});
