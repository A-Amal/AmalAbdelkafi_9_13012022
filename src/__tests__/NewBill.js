import {fireEvent, screen, getByTestId, getByRole} from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js";
import { ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import store from "../__mocks__/store.js";

const onNavigate = (pathname) => {
  document.body.innerHTML = ROUTES({ pathname });
};
//We indicate that the user is an Employee
Object.defineProperty(window, "localStorage", { value: localStorageMock });
window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then , Loading page should be rendered", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
    });
    test("Then I am on newBillPage and the form is present", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      expect(getByTestId(document.body,'form-new-bill')).toBeTruthy()
    })
    test("Then i amm on newBillPAge the field type de dépense proposes Transport by default ",()=>{
      const html = NewBillUI();
      document.body.innerHTML = html;
      expect(screen.getAllByText('Transports')).toBeTruthy()
    });
    test("Then i am on newBillPage the field type nom de la dépense proposes vol Paris Londres by default",()=>{
      const html = NewBillUI()
      document.body.innerHTML = html
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
    test('Then i am on newBillPage and i submit the bill but the datefield is not defined an error is displayed',()=>{

      const newBill = new NewBill({
        document,
        onNavigate,
        tore: null,
        localStorage: window.localStorage
      })
      const handleChangeFile = jest.fn(() => newBill.handleChangeFile);
      const file = screen.getByTestId("file");
      file.addEventListener("change", handleChangeFile);
      fireEvent.click(getByRole(document.body,'btn'))

      expect(newBill).toBe(true)


    })
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
      const html = NewBillUI();
      document.body.innerHTML = html;
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

/* test d'intégration POST */
describe("Given, i am connected as Employee", () => {
  describe("When i post a bill", () => {
    test("Then number of bills fetched should changed from 4 to 5 ", async () => {
      const post = jest.spyOn(store, "post");
      const newPost = {
        id: "qcEZGFSzhthteZAGRrHjaC",
        status: "refused",
        pct: 50,
        amount: 400,
        email: "monemail@email.com",
        name: "hhhhhhhh",
        vat: "80",
        fileName: "facture-screenshot.jpg",
        date: "2009-12-26",
        commentAdmin: "facture du mois de décembre",
        commentary: "test post",
        type: "Restaurants et bars",
        fileUrl:
            "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=4df6ed2c-12c8-42a2-b013-346c1346f732",
      };
      const newBillList = await store.post(newPost);
      expect(post).toHaveBeenCalledTimes(1);
      expect(post).toHaveBeenCalledWith({
        id: "qcEZGFSzhthteZAGRrHjaC",
        status: "refused",
        pct: 50,
        amount: 400,
        email: "monemail@email.com",
        name: "hhhhhhhh",
        vat: "80",
        fileName: "facture-screenshot.jpg",
        date: "2009-12-26",
        commentAdmin: "facture du mois de décembre",
        commentary: "test post",
        type: "Restaurants et bars",
        fileUrl:
            "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=4df6ed2c-12c8-42a2-b013-346c1346f732",
      });
      expect(newBillList.data.length).toBe(5);
    });


    /* erreur 404 */
    /*test("Then it return error 404 ", async () => {
      await store.post(() => Promise.reject(new Error("Erreur 404")));
      const html = BillsUI({ error: "Erreur 404" });
      document.body.innerHTML = html;
      const errorMessage = screen.getByText(/Erreur 404/);
      expect(errorMessage).toBeTruthy();
    });*/

    /* erreur 500 */
   /* test("Then it return error 500", async () => {
      await store.post(() => Promise.reject(new Error("Erreur 404")));
      const html = BillsUI({ error: "Erreur 500" });
      document.body.innerHTML = html;
      const errorMessage = screen.getByText(/Erreur 500/);
      expect(errorMessage).toBeTruthy();
    });*/
  });
});
