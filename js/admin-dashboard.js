(function () {
    const API_BASE = typeof API_URL !== "undefined" ? API_URL : "https://ideas-soft-backend.onrender.com";
    const DASHBOARD_STATE_KEY = "admin_dashboard_table_state_v1";

    const ENDPOINTS = {
        pagosListar: "/admin/pagos/Listar",
        pagoEstado: (id) => `/admin/pagos/${id}/estado`,
        clientesListar: "/admin/clientes/Listar",
        ticketsListar: "/admin/tickets/Listar",
        resumen: "/admin/dashboard/resumen",
        softwareTop: "/admin/dashboard/software-top",
        softwareCrear: "/software/Crear",
        softwareDesactivar: (id) => `/software/${id}/desactivar`,
        configuracion: (clave) => `/admin/configuracion/${encodeURIComponent(clave)}`,
        usuarioCrear: "/admin/usuarios/Crear"
    };

    const state = {
        query: "",
        payments: [],
        clients: [],
        tickets: [],
        filteredPayments: [],
        filteredClients: [],
        filteredTickets: [],
        paymentsView: {
            status: "all",
            from: "",
            to: "",
            page: 1,
            pageSize: 8,
            sortBy: "id",
            sortDir: "desc"
        },
        ticketsView: {
            status: "all",
            from: "",
            to: "",
            page: 1,
            pageSize: 8,
            sortBy: "fecha",
            sortDir: "desc"
        }
    };

    function readNumber(value, fallback) {
        const n = Number(value);
        return Number.isFinite(n) && n > 0 ? n : fallback;
    }

    function loadPersistedState() {
        try {
            const raw = localStorage.getItem(DASHBOARD_STATE_KEY);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (!saved || typeof saved !== "object") return;

            state.query = String(saved.query || "");

            const p = saved.paymentsView || {};
            state.paymentsView.status = String(p.status || "all");
            state.paymentsView.from = String(p.from || "");
            state.paymentsView.to = String(p.to || "");
            state.paymentsView.page = readNumber(p.page, 1);
            state.paymentsView.sortBy = String(p.sortBy || "id");
            state.paymentsView.sortDir = p.sortDir === "asc" ? "asc" : "desc";

            const t = saved.ticketsView || {};
            state.ticketsView.status = String(t.status || "all");
            state.ticketsView.from = String(t.from || "");
            state.ticketsView.to = String(t.to || "");
            state.ticketsView.page = readNumber(t.page, 1);
            state.ticketsView.sortBy = String(t.sortBy || "fecha");
            state.ticketsView.sortDir = t.sortDir === "asc" ? "asc" : "desc";
        } catch (_) {
            // Ignorar estado inválido y usar defaults.
        }
    }

    function persistState() {
        try {
            const payload = {
                query: state.query,
                paymentsView: {
                    status: state.paymentsView.status,
                    from: state.paymentsView.from,
                    to: state.paymentsView.to,
                    page: state.paymentsView.page,
                    sortBy: state.paymentsView.sortBy,
                    sortDir: state.paymentsView.sortDir
                },
                ticketsView: {
                    status: state.ticketsView.status,
                    from: state.ticketsView.from,
                    to: state.ticketsView.to,
                    page: state.ticketsView.page,
                    sortBy: state.ticketsView.sortBy,
                    sortDir: state.ticketsView.sortDir
                }
            };
            localStorage.setItem(DASHBOARD_STATE_KEY, JSON.stringify(payload));
        } catch (_) {
            // Si falla storage, no detener el dashboard.
        }
    }

    function syncControlsFromState() {
        if (els.globalSearch) els.globalSearch.value = state.query;

        if (els.paymentsStatusFilter) els.paymentsStatusFilter.value = state.paymentsView.status;
        if (els.paymentsDateFrom) els.paymentsDateFrom.value = state.paymentsView.from;
        if (els.paymentsDateTo) els.paymentsDateTo.value = state.paymentsView.to;

        if (els.ticketsStatusFilter) els.ticketsStatusFilter.value = state.ticketsView.status;
        if (els.ticketsDateFrom) els.ticketsDateFrom.value = state.ticketsView.from;
        if (els.ticketsDateTo) els.ticketsDateTo.value = state.ticketsView.to;
    }

    const els = {
        salesValue: document.getElementById("kpi-sales-value"),
        salesMeta: document.getElementById("kpi-sales-meta"),
        clientsValue: document.getElementById("kpi-clients-value"),
        clientsMeta: document.getElementById("kpi-clients-meta"),
        licensesValue: document.getElementById("kpi-licenses-value"),
        licensesMeta: document.getElementById("kpi-licenses-meta"),
        ticketsValue: document.getElementById("kpi-payments-value"),
        ticketsMeta: document.getElementById("kpi-payments-meta"),
        trend: document.getElementById("kpi-trend"),
        statusList: document.getElementById("status-list"),
        activityBody: document.getElementById("activity-body"),
        lineMain: document.getElementById("line-main"),
        lineShadow: document.getElementById("line-shadow"),
        linePoints: document.getElementById("line-points"),
        paymentsBody: document.getElementById("payments-body"),
        clientsBody: document.getElementById("clients-body"),
        ticketsBody: document.getElementById("tickets-body"),
        topSoftwareList: document.getElementById("top-software-list"),
        feedback: document.getElementById("admin-feedback"),
        globalSearch: document.getElementById("global-search"),
        refreshPayments: document.getElementById("refresh-payments"),
        exportPayments: document.getElementById("export-payments"),
        exportClients: document.getElementById("export-clients"),
        exportTickets: document.getElementById("export-tickets"),
        paymentsStatusFilter: document.getElementById("payments-status-filter"),
        paymentsDateFrom: document.getElementById("payments-date-from"),
        paymentsDateTo: document.getElementById("payments-date-to"),
        paymentsClearFilters: document.getElementById("payments-clear-filters"),
        paymentsPrev: document.getElementById("payments-prev"),
        paymentsNext: document.getElementById("payments-next"),
        paymentsPageInfo: document.getElementById("payments-page-info"),
        ticketsStatusFilter: document.getElementById("tickets-status-filter"),
        ticketsDateFrom: document.getElementById("tickets-date-from"),
        ticketsDateTo: document.getElementById("tickets-date-to"),
        ticketsClearFilters: document.getElementById("tickets-clear-filters"),
        ticketsPrev: document.getElementById("tickets-prev"),
        ticketsNext: document.getElementById("tickets-next"),
        ticketsPageInfo: document.getElementById("tickets-page-info"),
        createSoftwareForm: document.getElementById("create-software-form"),
        deactivateSoftwareForm: document.getElementById("deactivate-software-form"),
        configForm: document.getElementById("config-form"),
        createUserForm: document.getElementById("create-user-form")
    };

    function setFeedback(msg, isError) {
        if (!els.feedback) return;
        els.feedback.textContent = msg;
        els.feedback.style.color = isError ? "#b42318" : "#0f7a48";
    }

    function toNumber(value) {
        if (typeof value === "number") return value;
        if (typeof value === "string") {
            const clean = value.replace(/[^\d.-]/g, "");
            return Number(clean) || 0;
        }
        return 0;
    }

    function money(value) {
        const n = toNumber(value);
        return `S/ ${n.toLocaleString("es-PE", { maximumFractionDigits: 2 })}`;
    }

    function parseDateAny(value) {
        if (!value) return null;
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }

    function formatDate(value) {
        const d = parseDateAny(value);
        return d ? d.toLocaleDateString("es-PE") : "-";
    }

    function formatHour(value) {
        const d = parseDateAny(value);
        return d ? d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : "--:--";
    }

    function safeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function isObject(value) {
        return value && typeof value === "object" && !Array.isArray(value);
    }

    function unwrapArray(payload, extraKeys) {
        if (Array.isArray(payload)) return payload;
        if (!isObject(payload)) return [];

        const keys = (extraKeys || []).concat(["data", "items", "results", "rows", "list"]);
        for (const key of keys) {
            if (Array.isArray(payload[key])) return payload[key];
        }
        return [];
    }

    async function apiRequest(path, method, body, withAuth) {
        const headers = {};
        const token = localStorage.getItem("token");

        if (withAuth && token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const options = { method: method || "GET", headers };
        if (body !== undefined) {
            headers["Content-Type"] = "application/json";
            options.body = JSON.stringify(body);
        }

        const res = await fetch(`${API_BASE}${path}`, options);
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
        }

        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            return res.json();
        }

        return {};
    }

    function pickNumber(payload, keys) {
        if (!isObject(payload)) return 0;
        for (const key of keys) {
            if (payload[key] !== undefined && payload[key] !== null) return toNumber(payload[key]);
        }
        return 0;
    }

    function renderServiceStatus(flags) {
        if (!els.statusList) return;

        const items = [
            { name: "Pagos", ok: flags.pagos },
            { name: "Clientes", ok: flags.clientes },
            { name: "Tickets", ok: flags.tickets },
            { name: "Resumen", ok: flags.resumen },
            { name: "Top software", ok: flags.top }
        ];

        els.statusList.innerHTML = items
            .map((it) => `<li><span>${it.name}</span><strong class="${it.ok ? "ok" : "warn"}">${it.ok ? "Operativo" : "Sin respuesta"}</strong></li>`)
            .join("");
    }

    function statusTag(status) {
        const value = String(status || "").toLowerCase();
        if (value.includes("pend")) return "warning";
        if (value.includes("rech") || value.includes("error") || value.includes("fall")) return "info";
        return "success";
    }

    function normalize(text) {
        return String(text || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function buildNormalizedMap(text) {
        let normalized = "";
        const map = [];
        const original = String(text || "");

        for (let i = 0; i < original.length; i += 1) {
            const chunk = original[i]
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase();
            normalized += chunk;
            for (let j = 0; j < chunk.length; j += 1) {
                map.push(i);
            }
        }

        return { normalized, map, original };
    }

    function highlightText(value) {
        const text = String(value || "");
        const query = normalize(state.query).trim();
        if (!query) return escapeHtml(text);

        const { normalized, map, original } = buildNormalizedMap(text);
        if (!normalized.includes(query)) return escapeHtml(original);

        let cursor = 0;
        let from = 0;
        let html = "";

        while (from < normalized.length) {
            const idx = normalized.indexOf(query, from);
            if (idx === -1) break;

            const start = map[idx] ?? 0;
            const end = (map[idx + query.length - 1] ?? (original.length - 1)) + 1;

            if (start >= cursor) {
                html += escapeHtml(original.slice(cursor, start));
                html += `<mark class="table-hit">${escapeHtml(original.slice(start, end))}</mark>`;
                cursor = end;
            }

            from = idx + query.length;
        }

        html += escapeHtml(original.slice(cursor));
        return html;
    }

    function filterRows(rows, getTokens) {
        const query = normalize(state.query).trim();
        if (!query) return rows;

        return rows.filter((row) => normalize(getTokens(row)).includes(query));
    }

    function getDateKey(dateValue) {
        const d = parseDateAny(dateValue);
        if (!d) return "";
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    }

    function byStatusAndDate(rows, config, getStatus, getDate) {
        return rows.filter((row) => {
            const rowStatus = normalize(getStatus(row));
            const selectedStatus = normalize(config.status || "all");
            if (selectedStatus !== "all" && !rowStatus.includes(selectedStatus)) return false;

            const rowDate = getDateKey(getDate(row));
            if (config.from && (!rowDate || rowDate < config.from)) return false;
            if (config.to && (!rowDate || rowDate > config.to)) return false;
            return true;
        });
    }

    function paginate(rows, page, pageSize) {
        const total = rows.length;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const safePage = Math.min(Math.max(1, page), totalPages);
        const start = (safePage - 1) * pageSize;
        return {
            items: rows.slice(start, start + pageSize),
            page: safePage,
            totalPages,
            total
        };
    }

    function csvEscape(value) {
        const text = String(value ?? "");
        const escaped = text.replace(/"/g, "\"\"");
        return `"${escaped}"`;
    }

    function downloadCsv(filename, headers, rows) {
        const csvLines = [];
        csvLines.push(headers.map(csvEscape).join(","));
        rows.forEach((row) => {
            csvLines.push(row.map(csvEscape).join(","));
        });

        // BOM para que Excel respete UTF-8 (acentos/ñ).
        const content = `\uFEFF${csvLines.join("\r\n")}`;
        const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function exportPaymentsCsv() {
        if (!state.filteredPayments.length) {
            setFeedback("No hay datos de pagos para exportar.", true);
            return;
        }

        const rows = state.filteredPayments.map((p) => [
            p.id_pago || p.id || p.pago_id || "",
            p.cliente || p.cliente_nombre || p.email || "",
            toNumber(p.monto || p.total || p.amount),
            p.estado || "",
            formatDate(p.fecha || p.created_at || p.fecha_pago)
        ]);
        downloadCsv("pagos_dashboard.csv", ["ID", "Cliente", "Monto", "Estado", "Fecha"], rows);
        setFeedback("Exportación de pagos completada.", false);
    }

    function exportClientsCsv() {
        if (!state.filteredClients.length) {
            setFeedback("No hay datos de clientes para exportar.", true);
            return;
        }

        const rows = state.filteredClients.map((c) => [
            c.id || c.id_cliente || c.user_id || "",
            c.nombre || c.full_name || c.username || "",
            c.email || "",
            c.rol || c.role || "cliente",
            c.estado || (c.activo === false ? "inactivo" : "activo")
        ]);
        downloadCsv("clientes_dashboard.csv", ["ID", "Nombre", "Email", "Rol", "Estado"], rows);
        setFeedback("Exportación de clientes completada.", false);
    }

    function exportTicketsCsv() {
        if (!state.filteredTickets.length) {
            setFeedback("No hay datos de tickets para exportar.", true);
            return;
        }

        const rows = state.filteredTickets.map((t) => [
            t.id || t.id_ticket || "",
            t.usuario || t.cliente || t.email || "",
            t.asunto || t.titulo || t.descripcion || "",
            t.estado || "",
            formatDate(t.fecha || t.created_at || t.fecha_creacion)
        ]);
        downloadCsv("tickets_dashboard.csv", ["ID", "Usuario", "Asunto", "Estado", "Fecha"], rows);
        setFeedback("Exportación de tickets completada.", false);
    }

    function getSortValue(tableName, row, sortBy) {
        if (tableName === "payments") {
            if (sortBy === "id") return row.id_pago || row.id || row.pago_id || "";
            if (sortBy === "cliente") return row.cliente || row.cliente_nombre || row.email || "";
            if (sortBy === "monto") return toNumber(row.monto || row.total || row.amount);
            if (sortBy === "estado") return row.estado || "";
            if (sortBy === "fecha") return parseDateAny(row.fecha || row.created_at || row.fecha_pago)?.getTime() || 0;
        }

        if (tableName === "tickets") {
            if (sortBy === "id") return row.id || row.id_ticket || "";
            if (sortBy === "usuario") return row.usuario || row.cliente || row.email || "";
            if (sortBy === "asunto") return row.asunto || row.titulo || row.descripcion || "";
            if (sortBy === "estado") return row.estado || "";
            if (sortBy === "fecha") return parseDateAny(row.fecha || row.created_at || row.fecha_creacion)?.getTime() || 0;
        }

        return "";
    }

    function sortRows(rows, tableName, sortBy, sortDir) {
        const factor = sortDir === "asc" ? 1 : -1;
        return [...rows].sort((a, b) => {
            const av = getSortValue(tableName, a, sortBy);
            const bv = getSortValue(tableName, b, sortBy);

            if (typeof av === "number" && typeof bv === "number") {
                return (av - bv) * factor;
            }

            return String(av).localeCompare(String(bv), "es", { sensitivity: "base", numeric: true }) * factor;
        });
    }

    function updateSortIndicators() {
        document.querySelectorAll(".sort-btn[data-sort-table]").forEach((btn) => {
            const table = btn.getAttribute("data-sort-table");
            const key = btn.getAttribute("data-sort-key");
            const indicator = btn.querySelector(".sort-indicator");
            const view = table === "payments" ? state.paymentsView : state.ticketsView;

            btn.classList.remove("active");
            if (indicator) indicator.textContent = "-";

            if (view && view.sortBy === key) {
                btn.classList.add("active");
                if (indicator) indicator.textContent = view.sortDir === "asc" ? "▲" : "▼";
            }
        });
    }

    function applyGlobalFilter() {
        const paymentsByQuery = filterRows(state.payments, (p) =>
            `${p.id_pago || p.id || p.pago_id || ""} ${p.cliente || p.cliente_nombre || p.email || ""} ${p.monto || p.total || p.amount || ""} ${p.estado || ""}`
        );
        const clientsByQuery = filterRows(state.clients, (c) =>
            `${c.id || c.id_cliente || c.user_id || ""} ${c.nombre || c.full_name || c.username || ""} ${c.email || ""} ${c.rol || c.role || ""} ${c.estado || c.activo || ""}`
        );
        const ticketsByQuery = filterRows(state.tickets, (t) =>
            `${t.id || t.id_ticket || ""} ${t.usuario || t.cliente || t.email || ""} ${t.asunto || t.titulo || t.descripcion || ""} ${t.estado || ""} ${t.fecha || t.created_at || t.fecha_creacion || ""}`
        );

        const filteredPayments = byStatusAndDate(
            paymentsByQuery,
            state.paymentsView,
            (p) => p.estado || "",
            (p) => p.fecha || p.created_at || p.fecha_pago
        );
        const filteredTickets = byStatusAndDate(
            ticketsByQuery,
            state.ticketsView,
            (t) => t.estado || "",
            (t) => t.fecha || t.created_at || t.fecha_creacion
        );

        const sortedPayments = sortRows(filteredPayments, "payments", state.paymentsView.sortBy, state.paymentsView.sortDir);
        const sortedTickets = sortRows(filteredTickets, "tickets", state.ticketsView.sortBy, state.ticketsView.sortDir);
        state.filteredPayments = sortedPayments;
        state.filteredClients = clientsByQuery;
        state.filteredTickets = sortedTickets;

        const paymentsPage = paginate(sortedPayments, state.paymentsView.page, state.paymentsView.pageSize);
        const ticketsPage = paginate(sortedTickets, state.ticketsView.page, state.ticketsView.pageSize);

        state.paymentsView.page = paymentsPage.page;
        state.ticketsView.page = ticketsPage.page;
        updateSortIndicators();
        persistState();

        renderPayments(paymentsPage.items, paymentsPage);
        renderClients(clientsByQuery);
        renderTickets(ticketsPage.items, ticketsPage);
    }

    function hasPaymentsFilters() {
        return state.paymentsView.status !== "all" || !!state.paymentsView.from || !!state.paymentsView.to;
    }

    function hasTicketsFilters() {
        return state.ticketsView.status !== "all" || !!state.ticketsView.from || !!state.ticketsView.to;
    }

    function updateChart(values) {
        const points = values.length ? values : [0, 0, 0, 0, 0, 0];
        const width = 560;
        const height = 220;
        const left = 30;
        const right = 50;
        const top = 30;
        const bottom = 35;
        const max = Math.max(...points, 1);
        const min = Math.min(...points, 0);
        const range = Math.max(max - min, 1);
        const stepX = (width - left - right) / Math.max(points.length - 1, 1);

        const pairs = points.map((val, index) => {
            const x = left + (index * stepX);
            const y = top + (1 - ((val - min) / range)) * (height - top - bottom);
            return `${x},${y}`;
        });

        const poly = pairs.join(" ");
        if (els.lineMain) els.lineMain.setAttribute("points", poly);
        if (els.lineShadow) els.lineShadow.setAttribute("points", poly);
        if (els.linePoints) {
            els.linePoints.innerHTML = pairs.map((p) => {
                const [cx, cy] = p.split(",");
                return `<circle cx="${cx}" cy="${cy}" r="4"></circle>`;
            }).join("");
        }
    }

    function renderActivity(payments, tickets) {
        if (!els.activityBody) return;

        const rows = [];
        safeArray(payments).forEach((p) => {
            rows.push({
                date: parseDateAny(p.fecha || p.created_at || p.fecha_pago),
                cliente: p.cliente || p.cliente_nombre || p.email || "Cliente",
                accion: "Pago registrado",
                monto: toNumber(p.monto || p.total || p.amount),
                estado: p.estado || "pendiente"
            });
        });

        safeArray(tickets).forEach((t) => {
            rows.push({
                date: parseDateAny(t.fecha || t.created_at || t.fecha_creacion),
                cliente: t.usuario || t.cliente || t.email || "Usuario",
                accion: t.asunto || t.titulo || "Ticket de soporte",
                monto: 0,
                estado: t.estado || "abierto"
            });
        });

        rows.sort((a, b) => (b.date || 0) - (a.date || 0));

        if (!rows.length) {
            els.activityBody.innerHTML = '<tr><td colspan="5" class="table-empty">No hay actividad reciente.</td></tr>';
            return;
        }

        els.activityBody.innerHTML = rows.slice(0, 8).map((r) => `
            <tr>
                <td>${formatHour(r.date)}</td>
                <td>${r.cliente}</td>
                <td>${r.accion}</td>
                <td>${r.monto > 0 ? money(r.monto) : "-"}</td>
                <td><span class="tag ${statusTag(r.estado)}">${r.estado}</span></td>
            </tr>
        `).join("");
    }

    function renderPayments(payments, pageData) {
        if (!els.paymentsBody) return;

        if (els.paymentsPageInfo && pageData) {
            els.paymentsPageInfo.textContent = `Página ${pageData.page} de ${pageData.totalPages} (${pageData.total} registros)`;
        }
        if (els.paymentsPrev && pageData) els.paymentsPrev.disabled = pageData.page <= 1;
        if (els.paymentsNext && pageData) els.paymentsNext.disabled = pageData.page >= pageData.totalPages;

        if (!payments.length) {
            const msg = (state.query.trim() || hasPaymentsFilters()) ? "Sin resultados para la búsqueda/filtro." : "Sin pagos registrados.";
            els.paymentsBody.innerHTML = `<tr><td colspan="5" class="table-empty">${msg}</td></tr>`;
            return;
        }

        els.paymentsBody.innerHTML = payments.map((p) => {
            const id = p.id_pago || p.id || p.pago_id || "";
            const estado = String(p.estado || "pendiente").toLowerCase();
            const amount = money(p.monto || p.total || p.amount);
            return `
                <tr>
                    <td>${highlightText(id || "-")}</td>
                    <td>${highlightText(p.cliente || p.cliente_nombre || p.email || "Cliente")}</td>
                    <td>${highlightText(amount)}</td>
                    <td><span class="tag ${statusTag(estado)}">${highlightText(estado)}</span></td>
                    <td>
                        <div class="action-wrap">
                            <select class="status-input" data-status-select="${id}">
                                <option value="aprobado">aprobado</option>
                                <option value="pendiente">pendiente</option>
                                <option value="rechazado">rechazado</option>
                            </select>
                            <button class="btn-ui" data-validate-payment="${id}">Validar</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    function renderClients(clients) {
        if (!els.clientsBody) return;

        if (!clients.length) {
            const msg = state.query.trim() ? "Sin resultados para la búsqueda." : "Sin clientes registrados.";
            els.clientsBody.innerHTML = `<tr><td colspan="5" class="table-empty">${msg}</td></tr>`;
            return;
        }

        els.clientsBody.innerHTML = clients.slice(0, 50).map((c) => `
            <tr>
                <td>${highlightText(c.id || c.id_cliente || c.user_id || "-")}</td>
                <td>${highlightText(c.nombre || c.full_name || c.username || "-")}</td>
                <td>${highlightText(c.email || "-")}</td>
                <td>${highlightText(c.rol || c.role || "cliente")}</td>
                <td><span class="tag ${String(c.activo || c.estado || "").toLowerCase().includes("in") ? "info" : "success"}">${highlightText(c.estado || (c.activo === false ? "inactivo" : "activo"))}</span></td>
            </tr>
        `).join("");
    }

    function renderTickets(tickets, pageData) {
        if (!els.ticketsBody) return;

        if (els.ticketsPageInfo && pageData) {
            els.ticketsPageInfo.textContent = `Página ${pageData.page} de ${pageData.totalPages} (${pageData.total} registros)`;
        }
        if (els.ticketsPrev && pageData) els.ticketsPrev.disabled = pageData.page <= 1;
        if (els.ticketsNext && pageData) els.ticketsNext.disabled = pageData.page >= pageData.totalPages;

        if (!tickets.length) {
            const msg = (state.query.trim() || hasTicketsFilters()) ? "Sin resultados para la búsqueda/filtro." : "Sin tickets de soporte.";
            els.ticketsBody.innerHTML = `<tr><td colspan="5" class="table-empty">${msg}</td></tr>`;
            return;
        }

        els.ticketsBody.innerHTML = tickets.map((t) => `
            <tr>
                <td>${highlightText(t.id || t.id_ticket || "-")}</td>
                <td>${highlightText(t.usuario || t.cliente || t.email || "-")}</td>
                <td>${highlightText(t.asunto || t.titulo || t.descripcion || "Sin asunto")}</td>
                <td><span class="tag ${statusTag(t.estado)}">${highlightText(t.estado || "abierto")}</span></td>
                <td>${highlightText(formatDate(t.fecha || t.created_at || t.fecha_creacion))}</td>
            </tr>
        `).join("");
    }

    function renderTopSoftware(items) {
        if (!els.topSoftwareList) return;

        if (!items.length) {
            els.topSoftwareList.innerHTML = '<li><span>Sin datos de ventas</span><strong class="warn">-</strong></li>';
            return;
        }

        els.topSoftwareList.innerHTML = items.slice(0, 6).map((s, index) => `
            <li>
                <span>#${index + 1} ${s.software || s.nombre || s.producto || "Software"}</span>
                <strong class="ok">${toNumber(s.ventas || s.cantidad || s.total_ventas || s.count)}</strong>
            </li>
        `).join("");
    }

    function updateKpis(summary, clients, tickets) {
        const dailySales = pickNumber(summary, ["ventas_hoy", "monto_hoy", "sales_today", "ingresos_hoy"]);
        const clientsCount = pickNumber(summary, ["nuevos_clientes", "clientes", "total_clientes"]) || clients.length;
        const licensesCount = pickNumber(summary, ["licencias_activas", "total_licencias"]);
        const ticketsCount = pickNumber(summary, ["tickets_abiertos", "total_tickets_abiertos"]) || tickets.filter((t) => String(t.estado || "").toLowerCase().includes("abierto")).length;
        const trend = pickNumber(summary, ["tendencia", "trend", "crecimiento_mensual"]);

        if (els.salesValue) els.salesValue.textContent = money(dailySales);
        if (els.salesMeta) els.salesMeta.textContent = "Fuente: /admin/dashboard/resumen";
        if (els.clientsValue) els.clientsValue.textContent = String(clientsCount);
        if (els.clientsMeta) els.clientsMeta.textContent = "Fuente: /admin/clientes/Listar";
        if (els.licensesValue) els.licensesValue.textContent = String(licensesCount);
        if (els.licensesMeta) els.licensesMeta.textContent = "Licencias activas";
        if (els.ticketsValue) els.ticketsValue.textContent = String(ticketsCount);
        if (els.ticketsMeta) els.ticketsMeta.textContent = "Fuente: /admin/tickets/Listar";
        if (els.trend) els.trend.textContent = `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}%`;

        const monthly = unwrapArray(summary, ["ventas_mensuales", "monthly_sales", "serie_mensual"]).map((item) => toNumber(item.total || item.monto || item.ventas || item.value || item));
        const daily = unwrapArray(summary, ["ventas_diarias", "daily_sales", "serie_diaria"]).map((item) => toNumber(item.total || item.monto || item.ventas || item.value || item));
        updateChart(monthly.length ? monthly : daily);
    }

    function bindEvents() {
        const navLinks = document.querySelectorAll(".sidebar-menu a[data-nav-target]");
        if (navLinks.length) {
            navLinks.forEach((link) => {
                link.addEventListener("click", (event) => {
                    event.preventDefault();

                    const targetId = link.getAttribute("data-nav-target");
                    const target = targetId ? document.getElementById(targetId) : null;
                    if (!target) return;

                    document.querySelectorAll(".sidebar-menu li").forEach((li) => li.classList.remove("active"));
                    const li = link.closest("li");
                    if (li) li.classList.add("active");

                    target.scrollIntoView({ behavior: "smooth", block: "start" });

                    const sidebar = document.querySelector(".sidebar");
                    if (sidebar && window.innerWidth <= 860) {
                        sidebar.classList.remove("open");
                    }
                });
            });
        }

        document.addEventListener("click", async (event) => {
            const sortBtn = event.target.closest(".sort-btn[data-sort-table]");
            if (sortBtn) {
                const table = sortBtn.getAttribute("data-sort-table");
                const key = sortBtn.getAttribute("data-sort-key");
                const view = table === "payments" ? state.paymentsView : state.ticketsView;

                if (view && key) {
                    if (view.sortBy === key) {
                        view.sortDir = view.sortDir === "asc" ? "desc" : "asc";
                    } else {
                        view.sortBy = key;
                        view.sortDir = "asc";
                    }
                    view.page = 1;
                    applyGlobalFilter();
                }
                return;
            }

            const btn = event.target.closest("button[data-validate-payment]");
            if (!btn) return;

            const id = btn.getAttribute("data-validate-payment");
            if (!id) {
                setFeedback("No se encontró ID de pago para validar.", true);
                return;
            }

            const select = document.querySelector(`select[data-status-select="${id}"]`);
            const estado = select ? select.value : "aprobado";

            try {
                btn.disabled = true;
                await apiRequest(ENDPOINTS.pagoEstado(id), "PATCH", { estado }, true);
                setFeedback(`Pago ${id} actualizado a '${estado}'.`, false);
                await loadPaymentsOnly();
            } catch (err) {
                setFeedback(`Error validando pago ${id}: ${err.message}`, true);
            } finally {
                btn.disabled = false;
            }
        });

        if (els.refreshPayments) {
            els.refreshPayments.addEventListener("click", () => {
                loadPaymentsOnly().catch((err) => setFeedback(`Error recargando pagos: ${err.message}`, true));
            });
        }

        if (els.exportPayments) {
            els.exportPayments.addEventListener("click", exportPaymentsCsv);
        }

        if (els.exportClients) {
            els.exportClients.addEventListener("click", exportClientsCsv);
        }

        if (els.exportTickets) {
            els.exportTickets.addEventListener("click", exportTicketsCsv);
        }

        if (els.globalSearch) {
            els.globalSearch.addEventListener("input", (event) => {
                state.query = event.target.value || "";
                state.paymentsView.page = 1;
                state.ticketsView.page = 1;
                applyGlobalFilter();
            });
        }

        if (els.paymentsStatusFilter) {
            els.paymentsStatusFilter.addEventListener("change", (event) => {
                state.paymentsView.status = event.target.value || "all";
                state.paymentsView.page = 1;
                applyGlobalFilter();
            });
        }

        if (els.paymentsDateFrom) {
            els.paymentsDateFrom.addEventListener("change", (event) => {
                state.paymentsView.from = event.target.value || "";
                state.paymentsView.page = 1;
                applyGlobalFilter();
            });
        }

        if (els.paymentsDateTo) {
            els.paymentsDateTo.addEventListener("change", (event) => {
                state.paymentsView.to = event.target.value || "";
                state.paymentsView.page = 1;
                applyGlobalFilter();
            });
        }

        if (els.paymentsClearFilters) {
            els.paymentsClearFilters.addEventListener("click", () => {
                state.paymentsView.status = "all";
                state.paymentsView.from = "";
                state.paymentsView.to = "";
                state.paymentsView.page = 1;
                if (els.paymentsStatusFilter) els.paymentsStatusFilter.value = "all";
                if (els.paymentsDateFrom) els.paymentsDateFrom.value = "";
                if (els.paymentsDateTo) els.paymentsDateTo.value = "";
                applyGlobalFilter();
            });
        }

        if (els.paymentsPrev) {
            els.paymentsPrev.addEventListener("click", () => {
                state.paymentsView.page = Math.max(1, state.paymentsView.page - 1);
                applyGlobalFilter();
            });
        }

        if (els.paymentsNext) {
            els.paymentsNext.addEventListener("click", () => {
                state.paymentsView.page += 1;
                applyGlobalFilter();
            });
        }

        if (els.ticketsStatusFilter) {
            els.ticketsStatusFilter.addEventListener("change", (event) => {
                state.ticketsView.status = event.target.value || "all";
                state.ticketsView.page = 1;
                applyGlobalFilter();
            });
        }

        if (els.ticketsDateFrom) {
            els.ticketsDateFrom.addEventListener("change", (event) => {
                state.ticketsView.from = event.target.value || "";
                state.ticketsView.page = 1;
                applyGlobalFilter();
            });
        }

        if (els.ticketsDateTo) {
            els.ticketsDateTo.addEventListener("change", (event) => {
                state.ticketsView.to = event.target.value || "";
                state.ticketsView.page = 1;
                applyGlobalFilter();
            });
        }

        if (els.ticketsClearFilters) {
            els.ticketsClearFilters.addEventListener("click", () => {
                state.ticketsView.status = "all";
                state.ticketsView.from = "";
                state.ticketsView.to = "";
                state.ticketsView.page = 1;
                if (els.ticketsStatusFilter) els.ticketsStatusFilter.value = "all";
                if (els.ticketsDateFrom) els.ticketsDateFrom.value = "";
                if (els.ticketsDateTo) els.ticketsDateTo.value = "";
                applyGlobalFilter();
            });
        }

        if (els.ticketsPrev) {
            els.ticketsPrev.addEventListener("click", () => {
                state.ticketsView.page = Math.max(1, state.ticketsView.page - 1);
                applyGlobalFilter();
            });
        }

        if (els.ticketsNext) {
            els.ticketsNext.addEventListener("click", () => {
                state.ticketsView.page += 1;
                applyGlobalFilter();
            });
        }

        if (els.createSoftwareForm) {
            els.createSoftwareForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const formData = new FormData(els.createSoftwareForm);
                const payload = Object.fromEntries(formData.entries());
                payload.precio = toNumber(payload.precio);

                try {
                    await apiRequest(ENDPOINTS.softwareCrear, "POST", payload, true);
                    setFeedback("Software creado correctamente.", false);
                    els.createSoftwareForm.reset();
                } catch (err) {
                    setFeedback(`Error creando software: ${err.message}`, true);
                }
            });
        }

        if (els.deactivateSoftwareForm) {
            els.deactivateSoftwareForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const formData = new FormData(els.deactivateSoftwareForm);
                const id = formData.get("id_software");

                try {
                    await apiRequest(ENDPOINTS.softwareDesactivar(id), "PATCH", {}, true);
                    setFeedback(`Software ${id} desactivado correctamente.`, false);
                    els.deactivateSoftwareForm.reset();
                } catch (err) {
                    setFeedback(`Error desactivando software: ${err.message}`, true);
                }
            });
        }

        if (els.configForm) {
            els.configForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const formData = new FormData(els.configForm);
                const clave = String(formData.get("clave") || "").trim();
                const valor = String(formData.get("valor") || "").trim();

                try {
                    await apiRequest(ENDPOINTS.configuracion(clave), "PUT", { valor }, true);
                    setFeedback(`Configuración '${clave}' actualizada.`, false);
                } catch (err) {
                    setFeedback(`Error en configuración: ${err.message}`, true);
                }
            });
        }

        if (els.createUserForm) {
            els.createUserForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const formData = new FormData(els.createUserForm);
                const payload = Object.fromEntries(formData.entries());

                try {
                    await apiRequest(ENDPOINTS.usuarioCrear, "POST", payload, true);
                    setFeedback("Usuario interno creado correctamente.", false);
                    els.createUserForm.reset();
                } catch (err) {
                    setFeedback(`Error creando usuario: ${err.message}`, true);
                }
            });
        }
    }

    async function loadPaymentsOnly() {
        const data = await apiRequest(ENDPOINTS.pagosListar, "GET", undefined, true);
        const payments = unwrapArray(data, ["pagos", "payments", "ingresos"]);
        state.payments = payments;
        applyGlobalFilter();
    }

    async function loadDashboard() {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "../components/login.html";
            return;
        }

        setFeedback("Cargando dashboard administrativo...", false);

        const tasks = await Promise.allSettled([
            apiRequest(ENDPOINTS.resumen, "GET", undefined, true),
            apiRequest(ENDPOINTS.pagosListar, "GET", undefined, true),
            apiRequest(ENDPOINTS.clientesListar, "GET", undefined, true),
            apiRequest(ENDPOINTS.ticketsListar, "GET", undefined, true),
            apiRequest(ENDPOINTS.softwareTop, "GET", undefined, true)
        ]);

        const resumenOK = tasks[0].status === "fulfilled";
        const pagosOK = tasks[1].status === "fulfilled";
        const clientesOK = tasks[2].status === "fulfilled";
        const ticketsOK = tasks[3].status === "fulfilled";
        const topOK = tasks[4].status === "fulfilled";

        const resumen = resumenOK ? (tasks[0].value || {}) : {};
        const pagos = pagosOK ? unwrapArray(tasks[1].value, ["pagos", "payments", "ingresos"]) : [];
        const clientes = clientesOK ? unwrapArray(tasks[2].value, ["clientes", "users", "usuarios"]) : [];
        const tickets = ticketsOK ? unwrapArray(tasks[3].value, ["tickets", "soporte", "items"]) : [];
        const topSoftware = topOK ? unwrapArray(tasks[4].value, ["top", "software", "items"]) : [];

        state.payments = pagos;
        state.clients = clientes;
        state.tickets = tickets;

        updateKpis(resumen, clientes, tickets);
        applyGlobalFilter();
        renderTopSoftware(topSoftware);
        renderActivity(pagos, tickets);

        renderServiceStatus({
            pagos: pagosOK,
            clientes: clientesOK,
            tickets: ticketsOK,
            resumen: resumenOK,
            top: topOK
        });

        if (resumenOK || pagosOK || clientesOK || ticketsOK || topOK) {
            setFeedback("Dashboard sincronizado con backend administrador.", false);
        } else {
            setFeedback("No se pudo cargar información del backend administrador.", true);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const adminName = document.getElementById("admin-name");
        const email = localStorage.getItem("user_email");
        if (adminName && email) adminName.textContent = email;

        loadPersistedState();
        syncControlsFromState();
        bindEvents();
        loadDashboard().catch((err) => setFeedback(`Error inicializando dashboard: ${err.message}`, true));
    });
})();
