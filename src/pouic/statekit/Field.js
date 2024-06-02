export class FieldBase {
  constructor(autoValidationDelay = 500, errored = false, errorText = '') {
    this.errored = errored
    this.errorText = errorText
    this.autoValidationDelay = autoValidationDelay
    this._validationTimeoutId = null;
    this.value = undefined
    /* The input should be set mannually in order for the parent form to retrieve the value */
    this.input = undefined
    /*User can choose to either set input or overload getValue()*/
    this.getValue = () => this.input.value
  }

  cancelValidation() {
    clearTimeout(this._validationTimeoutId);
  }

  onChange(event) {
    this.cancelValidation()
    this._validationTimeoutId = setTimeout(() => this._onChange(), this.autoValidationDelay);
  }

  setError(err) {
    this.errored = true
    this.errorText = err
  }

  clearError() {
    this.errored = false
    this.errorText = ''
  }

  validation() {
    // Ensure the validation is not retriggered automatically if the user where to call the validation method manually
    this.cancelValidation()
    this.value = this.getValue()
  }

  _onChange() {
    this.validation(this.getValue())
  }
}

export class YupField extends FieldBase {
  constructor(schema, autoValidationDelay = 500, errored = false, errorText = '') {
    super(autoValidationDelay, errored, errorText)
    this.schema = schema
    this._description = schema.describe()
    this.oneOf = this._description.oneOf
    this.value = this._description.default
    this.__proxyFilter = key => key !== "schema"
  }

  setInput(input) {
    this.input = input
    input.value = this.value
  }

  validation() {
    super.validation()
    return this.schema
               .validate(this.value)
      .then(() => {this.clearError(); return true })
      .catch((err) => { this.setError(err.message); return false });
  }

  // TODO create only for number
  get min() {
    return this._description.tests.find(test => test.name === "min")?.params.min
  }

  // TODO create only for number
  get max() {
    return this._description.tests.find(test => test.name === "max")?.params.max
  }

  get label() {
    return this._description.meta.label
  }
}

export class RpcYupForm {
  constructor(server,rpcAction, schema, onSuccess) {
    this._server = server
    this._schema = schema
    for (const [key,field] of Object.entries(schema.fields)) {
      this[key] = new YupField(field)
    }
    this._onSuccess = onSuccess
    this._rpcAction = rpcAction
    this.__proxyFilter = key => Object.keys(this._schema.fields).includes(key)
  }

  get value() {
    return Object.fromEntries(Object.entries(this.fields).map(([key, field]) => [key, field.getValue()]))
  }

  /* NOTE: be aware that methods/property accessing fields.xxx does not trigger observers  */
  get fields() {
    return Object.fromEntries(Object.keys(this._schema.fields).map(fieldKey => [fieldKey, this[fieldKey]]))
  }

  get fieldsArr() {
    return Object.keys(this._schema.fields).map(fieldKey => this[fieldKey])
  }

  clearErrors(){
    this.fieldsArr.map(field => field.clearError())
  }

  schemaValidation() {
    return Promise.all(this.fieldsArr.map(field => field.validation()))
  }

  async submit() {
    // HACK prevent accessing through proxy as ws doesn't like it. TODO submit PR ?
    //const server = Reflect.getOwnPropertyDescriptor(this, 'server').value
    const submitValue = this.value
    await this.schemaValidation()
      && this._server.call(this._rpcAction, submitValue)
             .then((resp)=>{this.clearErrors();this._onSuccess(resp); })
               .catch((err) => {
                 console.log(err)
                 if (!err.data)
                   {
                   console.error("Error response should contain a 'data' key", err)
                     return
                   }
                 const errData = err.data

                 if (errData === "method")
                   console.warn("Server error response: ", errData)
                 else
                 // TODO Selectively clear errors ?
                   Object.entries(errData).forEach(([fieldKey, errMsg])=> {console.log(fieldKey);return this[fieldKey].setError(errMsg)})
               })
  }
}

export const rpcYupForms = (server, forms) => Object.fromEntries(Object.entries(forms).map(([key, {schema, onSuccess}]) => [key, new RpcYupForm(server,key, schema, onSuccess)]))
