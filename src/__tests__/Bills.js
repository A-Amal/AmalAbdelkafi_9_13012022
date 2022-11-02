
/**
 * @jest-environment jsdom
 */
import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import {  ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore)


// views/Bills component: increase the coverage rate to 100%
// test of the loading of the bills page
describe("When I am on Bill page but it is loading", () => {
  /**
   * Loading
   */
  test("Then, Loading page should be rendered", () => {
    const html = BillsUI({ loading: true });
    document.body.innerHTML = html;
    expect(screen.getAllByText("Loading...")).toBeTruthy();
  });
});

// test error message if not loading bills page
describe("When I am on Bill page but error message", () => {
  test("Then, Error page should be rendered", () => {
    const html = BillsUI({ error: "error" });
    document.body.innerHTML = html;
    expect(screen.getAllByText("Erreur")).toBeTruthy();
  });
});
/**
 * Menu icon highlighted
 */
describe("Given I am connected as an employee, when I am on Bills Page", () => {
  test("Then bill icon in vertical layout should be highlighted", async () => {

    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
    );
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.append(root);
    router();
    window.onNavigate(ROUTES_PATH.Bills);
    await waitFor(() => screen.getByTestId("icon-window"));
    const windowIcon = screen.getByTestId("icon-window");
    expect(screen.getByTestId('icon-window').classList.contains('active-icon')).toBe(true)


  })
  /**
   * Bills order
   */
  test("Then bills should be ordered from earliest to latest", () => {
    const html = BillsUI({ data: bills });
    document.body.innerHTML = html;
    const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML);
    const antiChrono = (a, b) => ((a < b) ? 1 : -1);
    const datesSorted = [...dates].sort(antiChrono);
    expect(dates).toEqual(datesSorted)
  })
})


// container/Bills component:
describe("When I click on the new bill button", () => {
  //test of the handleClickNewBill function (allows the display of the expense report form "note de frais")
  test("Then the click function handleClickNewBill should be called", () => {
    // Sim global environement
    document.body.innerHTML = BillsUI({data: bills});
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }
    const newBill = new Bills({
      document,
      onNavigate,
      store: null,
      localStorage: window.localStorage,
    });
    const handleClickNewBill = jest.fn(newBill.handleClickNewBill);
    const btnNewBill = screen.getByTestId("btn-new-bill");
    btnNewBill.addEventListener("click", handleClickNewBill);
    fireEvent.click(btnNewBill);
    expect(handleClickNewBill).toBeCalled();
  });
  //Check that we arrive on the NewBill page
  test("Then newbill appears", () => {
    // Sim global environement
    document.body.innerHTML = BillsUI({data: bills});
    //J'intègre le chemin d'accès
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname })
    }
    const billsPage = new Bills({
      document,
      onNavigate,
      store: null,
      bills: bills,
      localStorage: window.localStorage
    })
    //création constante pour la fonction qui appel la fonction a tester
    const OpenNewBill = jest.fn(billsPage.handleClickNewBill);//l20 bills.js
    const btnNewBill = screen.getByTestId("btn-new-bill")//cible le btn nouvelle note de frais
    btnNewBill.addEventListener("click", OpenNewBill)//écoute évènement
    fireEvent.click(btnNewBill)//simule évènement au click
    // on vérifie que la fonction est appelée et que la page souhaitée s'affiche
    expect(OpenNewBill).toHaveBeenCalled()//je m'attends à ce que la page nouvelle note de frais se charge
    expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()//la nouvelle note de frais apparait avec le titre envoyer une note de frais
  })
});
//test handleClickIconEye ligne 14 containers/Bills.js
describe("When I click on the eye icon", () => {
  test("Then a modal should be open", () => {
    Object.defineProperty(window, localStorage, { value: localStorageMock });//simule des données dans le localstorage
    window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));//on simule en utilisateur connécter de type employé

    document.body.innerHTML = BillsUI({data: bills})

    const onNavigate = (pathname) => {//navigation vers la route bills
      document.body.innerHTML = ROUTES({ pathname });
    };
    //MOCK de la modale
    $.fn.modal = jest.fn();//affichage de la modale, Prevent jQuery error

    let billsList = new Bills({
      document,
      onNavigate,
      store: null,
      localStorage: window.localStorage
    });

    const eye = screen.getAllByTestId('icon-eye')[0];// Get first
   const handleClickIconEye = jest.fn(billsList.handleClickIconEye(eye))
    eye.addEventListener('click', handleClickIconEye);
    fireEvent.click(eye);
    expect(handleClickIconEye).toHaveBeenCalled();
    expect($.fn.modal).toHaveBeenCalled();
    expect(screen.getByTestId('modaleFile')).toBeTruthy()

  });

});
// test d'integration get bill
describe("When I get bills", () => {//Quand je demande de récupérer des factures
  test("Then it should render bills", async () => {
    jest.mock("../app/Store", () => mockStore)
    //Ensuite, il devrait afficher les factures
    const bills = new Bills({//récupération des factures dans le store
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });
    const getBills = jest.fn( bills.getBills);//simulation du click
    const value = await getBills();//vérification
    expect(getBills).toHaveBeenCalled();//ON TEST SI LA METHODE EST APPELEE
    expect(value.length).toBe(4);//test si la longeur du tableau est a 4 du store.js
  });
});


/**
 * GET integration test
 */
describe("When I navigate to Bills Page", () => {
  test("fetches bills from an API and fails with 404 message error", async () => {
    jest.spyOn(mockStore, 'bills')
    mockStore.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 404"))
    )
    const html = BillsUI({ error: "Erreur 404" })
    document.body.innerHTML = html
    const message = await screen.getByText(/Erreur 404/)
    expect(message).toBeTruthy()
  })
  test("fetches messages from an API and fails with 500 message error", async () => {
    jest.spyOn(mockStore, 'bills')
    mockStore.bills.mockImplementationOnce(() =>
        Promise.reject(new Error("Erreur 500"))
    )
    const html = BillsUI({ error: "Erreur 500" })
    document.body.innerHTML = html
    const message = await screen.getByText(/Erreur 500/)
    expect(message).toBeTruthy()
  })
})
