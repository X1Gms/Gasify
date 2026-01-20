document.addEventListener("DOMContentLoaded", () => {
    
    const summQty = document.getElementById("summQty");
    
    // Se o elemento existe, estamos na página de Checkout
    if (summQty) { 
        
        // 1. Ler dados da URL (enviados pela página anterior)
        const urlParams = new URLSearchParams(window.location.search);
        const qtyParam = urlParams.get('qty');
        const planParam = urlParams.get('plan');

        // Valores por defeito caso a URL esteja vazia (fallback)
        const quantity = qtyParam ? parseInt(qtyParam) : 1; 
        const isPremium = planParam === 'premium'; // Se for 'free', isto dá false

        console.log("Dados recebidos:", { quantity, isPremium });

        // 2. Definir Preços
        const HARDWARE_PRICE = 50.00;
        const SUBSCRIPTION_PRICE = isPremium ? 4.99 : 0.00;
        const planName = isPremium ? "Subscrição Premium (Mensal)" : "Subscrição Básica (Grátis)";

        // 3. Cálculos
        const hardwareTotal = quantity * HARDWARE_PRICE;
        const totalToPay = hardwareTotal + SUBSCRIPTION_PRICE;

        // 4. Preencher o HTML do Resumo
        const summHwTotal = document.getElementById("summHwTotal");
        const summHwFinal = document.getElementById("summHwFinal");
        const summPlanName = document.getElementById("summPlanName");
        const summPlanPrice = document.getElementById("summPlanPrice");
        const summPlanFinal = document.getElementById("summPlanFinal");
        const summTotal = document.getElementById("summTotal");
        const summNote = document.getElementById("summNote");
        const payButton = document.getElementById("payButton");

        // Atualizar textos
        summQty.textContent = quantity;
        summHwTotal.textContent = hardwareTotal.toFixed(2) + "€";
        summHwFinal.textContent = hardwareTotal.toFixed(2) + "€";
        
        summPlanName.textContent = planName;
        summPlanPrice.textContent = SUBSCRIPTION_PRICE.toFixed(2) + "€";
        summPlanFinal.textContent = SUBSCRIPTION_PRICE.toFixed(2) + "€";
        
        summTotal.textContent = totalToPay.toFixed(2) + "€";
        payButton.textContent = `Pagar Total: ${totalToPay.toFixed(2)}€`;

        // Nota de rodapé dinâmica
        if (isPremium) {
            summNote.textContent = "* A subscrição de 4.99€ renova mensalmente e cobre todos os sensores desta conta.";
        } else {
            summNote.textContent = "* Plano Gratuito selecionado. Sem mensalidades, apenas alertas básicos por email.";
        }

        // --- 5. LÓGICA DE PAGAMENTO SIMULADO ---
        const form = document.getElementById("checkoutForm");
        
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Dados inseridos
            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            
            const btn = form.querySelector("button[type='submit']");
            const originalText = btn.innerText;

            // Loading state
            btn.innerText = "A processar pagamento...";
            btn.style.opacity = "0.7";
            btn.disabled = true;

            // Simula delay de 1.5s
            await new Promise(r => setTimeout(r, 1500));

            // Log de "Sucesso" na consola
            console.log("--- PAGAMENTO SIMULADO COM SUCESSO ---");
            console.log("Cliente:", name);
            console.log("Hardware:", quantity, "x 50€");
            console.log("Plano:", planName);
            console.log("Total Pago:", totalToPay.toFixed(2) + "€");

            // Preenche o modal de sucesso com os dados reais
            document.getElementById("successName").textContent = name;
            document.getElementById("successEmail").textContent = email;
            
            // Abre o modal
            document.getElementById("successOverlay").classList.add("show");

            // Restaura botão (visual apenas, pois o modal tapa o ecrã)
            btn.innerText = originalText;
            btn.disabled = false;
            btn.style.opacity = "1";
        });
    }
});