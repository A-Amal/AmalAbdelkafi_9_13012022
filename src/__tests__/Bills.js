import { screen,fireEvent  } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import Router from '../app/Router.js'
import Store from "../app/Store";
import userEvent from "@testing-library/user-event";
import store from "../__mocks__/store.js";

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};
//On indique que l'utilisateur est un Employee
Object.defineProperty(window, "localStorage", { value: localStorageMock });
window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

// composant views/Bills : faire passer le taux de couverture à 100% :test du chargement de la page bills
describe("When I am on Bill page but it is loading", () => {
  test("Then, Loading page should be rendered", () => {
    const html = BillsUI({ loading: true });
    document.body.innerHTML = html;
    expect(screen.getAllByText("Loading...")).toBeTruthy();
  });
});

// test du message d'erreur si non chargement de la page bills
describe("When I am on Bill page but error message", () => {
  test("Then, Error page should be rendered", () => {
    const html = BillsUI({ error: "error" });
    document.body.innerHTML = html;
    expect(screen.getAllByText("Erreur")).toBeTruthy();
  });
});

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
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
    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML);
      const antiChrono = (a, b) => ((a < b) ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted)
    })
  })
})

// composant container/Bills :
describe("When I click on the new bill button", () => {
  test("Then the click function handleClickNewBill should be called", () => {
    // test de la fonction handleClickNewBill (permet l'affichage du  formulaire de note de frais)
    const html = BillsUI({ data: bills });
    document.body.innerHTML = html;
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
});

describe("When I click on the eye icon", () => {
  test("Then a modal should be open", () => {
    const html = BillsUI({ data: bills })
    document.body.innerHTML = html
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
describe("Given I am connected as Employee", () => {
  test("fetches bills from mock API GET", async () => {
    const getSpy = jest.spyOn(store, "get");
    const bills = await store.get();
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(bills.data.length).toBe(4);
  });
  test("fetches bills from an API and fails with 404 message error", async () => {
    store.get(() =>
        Promise.reject(new Error("Erreur 404"))
    );
    const html = BillsUI({ error: "Erreur 404" });
    document.body.innerHTML = html;
    const message =  screen.getByText(/Erreur 404/);
    expect(message).toBeTruthy();
  });
  test("fetches messages from an API and fails with 500 message error", async () => {
    store.get(() =>
        Promise.reject(new Error("Erreur 500"))
    );
    const html = BillsUI({ error: "Erreur 500" });
    document.body.innerHTML = html;
    const message = screen.getByText(/Erreur 500/);
    expect(message).toBeTruthy();
  });
});
