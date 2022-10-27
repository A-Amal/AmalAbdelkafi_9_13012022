import {fireEvent, screen} from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js"
import {bills} from "../fixtures/bills.js"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import Bills from "../containers/Bills.js";
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import Router from '../app/Router.js'


import userEvent from "@testing-library/user-event";
import store from "../__mocks__/store.js";

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};
//On indique que l'utilisateur est un Employee
Object.defineProperty(window, "localStorage", { value: localStorageMock });
window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

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
  test("Then bill icon in vertical layout should be highlighted", () => {
    // Sim global environement
    store.bills = () => {
      return ({bills, get: jest.fn().mockResolvedValue});
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock }); // mock localStorage
    window.localStorage.setItem('user', JSON.stringify({type: 'Employee'})); // Set user as Employee in localStorage
    Object.defineProperty(window, "location", { value: { hash: ROUTES_PATH['Bills'] } }); // Set location
    document.body.innerHTML = `<div id="root"></div>`
    Router();
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
  test("Then the click function handleClickNewBill should be called", () => {
    // test de la fonction handleClickNewBill (permet l'affichage du  formulaire de note de frais)
    document.body.innerHTML = BillsUI({data: bills});
    const newBill = new Bills({
      document,
      onNavigate,
      store: null,
      localStorage: window.localStorage,
    });
    const handleClickNewBill = jest.fn(newBill.handleClickNewBill);
    const btnNewBill = screen.getByTestId("btn-new-bill");
    btnNewBill.addEventListener("click", handleClickNewBill);
    userEvent.click(btnNewBill);
    expect(handleClickNewBill).toBeCalled();
  });
  test("Then newbill appears", () => { // Vérifie qu'on arrive bien sur la page NewBill
    document.body.innerHTML = BillsUI({data: bills});
    const newBill = new Bills({
      document,
      onNavigate,
      store: null,
      localStorage: window.localStorage,
    });
    const handleClickNewBill = jest.fn(newBill.handleClickNewBill);
    const btnNewBill = screen.getByTestId("btn-new-bill");
    btnNewBill.addEventListener("click", handleClickNewBill);
    userEvent.click(btnNewBill);
    expect(handleClickNewBill).toBeCalled();
    expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()//la nouvelle note de frais apparait avec le titre envoyer une note de frais
  })
});
//test handleClickIconEye ligne 14 containers/Bills.js
describe("When I click on the eye icon", () => {
  test("Then a modal should be open", () => {
    document.body.innerHTML = BillsUI({data: bills})
    $.fn.modal = jest.fn()// Prevent jQuery error
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
/*describe("When I get bills", () => {//Quand je demande de récupérer des factures
  test("Then it should render bills", async () => {//Ensuite, il devrait afficher les factures
    const bills = new Bills({//récupération des factures dans le store
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });
    const getBills = jest.fn( bills.getBills);//simulation du click
    const value = await getBills();//vérification
    expect(getBills).toHaveBeenCalled();//ON TEST SI LA METHODE EST APPELEE
    console.log(value)
    expect(value.length).toBe(4);//test si la longeur du tableau est a 4 du store.js
  });
});*/

describe("When I navigate to Bills page", () => {
  test("fetches bills from mock API GET", async () => {
    const getSpy = jest.spyOn(mockStore, "bills")
    const bills =  mockStore.bills()
    expect(getSpy).toHaveBeenCalledTimes(1)
    const listSpy = jest.spyOn(bills, "list")
    const list = await bills.list()
    expect(listSpy).toHaveBeenCalledTimes(1)
    expect(list.length).toBe(4)
  })
})


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

