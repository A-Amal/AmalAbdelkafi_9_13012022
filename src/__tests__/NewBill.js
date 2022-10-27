import {fireEvent, getByTestId, screen} from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import store from "../__mocks__/store";
import Router from "../app/Router.js";

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};
//We indicate that the user is an Employee
Object.defineProperty(window, "localStorage", { value: localStorageMock });
window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then , Loading page should be rendered", () => {
      document.body.innerHTML = NewBillUI();
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    });
    test("Then I am on newBillPage and the form is present", () => {
      document.body.innerHTML = NewBillUI()
      expect(getByTestId(document.body,'form-new-bill')).toBeTruthy()
    })
    test("Then i am on newBillPAge the field type de dépense proposes Transport by default ",()=>{
      document.body.innerHTML = NewBillUI();
      expect(screen.getAllByText('Transports')).toBeTruthy()
    });
    test("Then i am on newBillPage the field type nom de la dépense proposes vol Paris Londres by default",()=>{
      document.body.innerHTML = NewBillUI()
      expect(screen.getByPlaceholderText('Vol Paris Londres')).toBeTruthy()

    });

    test('Then i am on newBillPage and i click on select btn type de dépense, several choice are available',()=>{
      const html = NewBillUI()
      document.body.innerHTML = html
      userEvent.click(getByTestId(document.body,'expense-type'))
      expect(screen.getAllByText('Transports')).toBeTruthy()
      expect(screen.getAllByText('Restaurants et bars')).toBeTruthy()
      expect(screen.getAllByText('Hôtel et logement')).toBeTruthy()
      expect(screen.getAllByText('Services en ligne')).toBeTruthy()
      expect(screen.getAllByText('IT et électronique')).toBeTruthy()
      expect(screen.getAllByText('Equipement et matériel')).toBeTruthy()
      expect(screen.getAllByText('Fournitures de bureau')).toBeTruthy()
    });


    // test of the handleSubmit function (allows the expense report form to be sent)
    test("Then the submit function handleSubmit should be called", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      const handleSubmit = jest.fn(newBill.handleSubmit);
      const formNewBill = screen.getByTestId("form-new-bill");
      formNewBill.addEventListener("submit", handleSubmit);
      fireEvent.submit(formNewBill);
      expect(handleSubmit).toBeCalled();
    });
  });
  /* import of compliant document (PNG, JPEG, JPG)*/
  describe("When i choose the good format file ", () => {
    test("then the file is upload", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const handleChangeFile = jest.fn(NewBill.handleChangeFile)
      const inputFile = screen.getByTestId("file")
      inputFile.addEventListener('change', handleChangeFile)
      fireEvent.change(inputFile, {
        target: {
          files: [new File(["myProof.png"], "myProof.png", { type: "image/png" })]
        }
      })
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].name).toBe("myProof.png");
    });
  });
  /* import of non-compliant document (txt, pdf) */
  describe("When i choose a file that does not match the supported formats ", () => {
    test("Then a error message should be display", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
      const file = screen.getByTestId("file");
      file.addEventListener("change", handleChangeFile);
      fireEvent.change(file, {
        target: {
          files: [
            new File(["fiche"], "fiche.txt", { type: "texte/txt" }),
          ],
        },
      });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(file.value).toEqual("");
      expect(screen.getByTestId("error-img").style.display).toBe("block");
    });
  });
  describe("When all is valid on NewBill", () => {
    // we test that we return to the bills page after sending a valid form
    test("then after the bill was created, we should be redirected to Bills page", async () => {
      document.body.innerHTML = NewBillUI();
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });
      const formNewBill = screen.getByTestId("form-new-bill");
      const bill = {
        type: "Transports",
        name: "Test the Bill",
        amount: 200,
        date: "2020-06-22",
        vat: 40,
        pct: 12,
        commentary: "...",
        fileUrl: "imgTest.png",
        fileName: "imgTest.png",
      };
      const handleSubmit = jest.fn(newBill.handleSubmit);
      newBill.createBill = (newBill) => newBill;
      screen.getByTestId("expense-type").value = bill.type;
      screen.getByTestId("expense-name").value = bill.name;
      screen.getByTestId("amount").value = bill.amount;
      screen.getByTestId("datepicker").value = bill.date;
      screen.getByTestId("vat").value = bill.vat;
      screen.getByTestId("pct").value = bill.pct;
      screen.getByTestId("commentary").value = bill.commentary;
      newBill.fileUrl = bill.fileUrl;
      newBill.fileName = bill.fileName;

      formNewBill.addEventListener("click", handleSubmit);
      fireEvent.click(formNewBill);
      expect(handleSubmit).toHaveBeenCalled();
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });
});

//Test d'intégration POST
describe('Given I am a user connected as Employee', () => {//Etant donné que je suis un utilisateur connecté en tant que Salarié
  describe("When I submit the form completed", () => {//Lorsque je soumets le formulaire rempli
    test("Then the bill is created", async() => {//Ensuite, la facture est créée

      document.body.innerHTML = NewBillUI()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({pathname});
      };
//SIMILATION DE LA CONNECTION DE L EMPLOYEE
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "azerty@email.com",
      }))
//SIMULATION DE CREATION DE LA PAGE DE FACTURE
      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      const validBill = {
        type: "Vol",
        name: "Paris Algerie",
        date: "2022-10-25",
        amount: 400,
        vat: 70,
        pct: 30,
        commentary: "Commentary",
        fileUrl: "../img/0.jpg",
        fileName: "test.jpg",
        status: "pending"
      };

      // Charger les valeurs dans les champs
      screen.getByTestId("expense-type").value = validBill.type;
      screen.getByTestId("expense-name").value = validBill.name;
      screen.getByTestId("datepicker").value = validBill.date;
      screen.getByTestId("amount").value = validBill.amount;
      screen.getByTestId("vat").value = validBill.vat;
      screen.getByTestId("pct").value = validBill.pct;
      screen.getByTestId("commentary").value = validBill.commentary;

      newBill.fileName = validBill.fileName
      newBill.fileUrl = validBill.fileUrl;

      newBill.updateBill = jest.fn();//SIMULATION DE  CLICK
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))//ENVOI DU FORMULAIRE

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form)

      expect(handleSubmit).toHaveBeenCalled()//VERIFICATION DE L ENVOI DU FORMULAIRE
      expect(newBill.updateBill).toHaveBeenCalled()//VERIFIE SI LE FORMULAIRE EST ENVOYER DANS LE STORE

    })

//test erreur 500
    test('fetches error from an API and fails with 500 error', async () => {//récupère l'erreur d'une API et échoue avec l'erreur 500
      jest.spyOn(store, 'bills')
      jest.spyOn(console, 'error').mockImplementation(() => {})// Prevent Console.error jest error

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } })

      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = `<div id="root"></div>`
      Router()

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      store.bills.mockImplementationOnce(() => {
        return {
          update : () =>  {
            return Promise.reject(new Error('Erreur 500'))
          }
        }
      })
      const newBill = new NewBill({document,  onNavigate, store: store, localStorage: window.localStorage})

      // Soumettre le formulaire
      const form = screen.getByTestId('form-new-bill')
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener('submit', handleSubmit)
      fireEvent.submit(form)
      await new Promise(process.nextTick)
      expect(console.error).toBeCalled()
    })
  })
});
