#!/usr/bin/env python3
from anki.collection import Collection
from dotenv import load_dotenv
import os

load_dotenv()

def update_anki_template(col_path, model_name, new_back_template):
    # Open the collection
    col = Collection(col_path)

    # Find the model
    model = col.models.by_name(model_name)
    if not model:
        print(f"Model '{model_name}' not found.")
        return

    # Update the back template
    model['tmpls'][0]['afmt'] = new_back_template

    col.models.save(model)

    a = col.sync_login(os.getenv("ANKI_USERNAME", ""), os.getenv("ANKI_PASSWORD", ""), os.getenv("ANKI_ENDPOINT", "https://ankiweb.net/"))
    col.sync_collection(a, False)

    print(f"Back template for model '{model_name}' updated successfully.")

if __name__ == "__main__":
    # Path to your Anki collection file
    col_path = os.getenv("ANKI_COLLECTION_PATH", os.path.join(os.path.expanduser("~"), "/.var/app/net.ankiweb.Anki/data/Anki2/Main/collection.anki2"))
    model_name = os.getenv("ANKI_MODEL_NAME", "")
    template_filepath = os.getenv("ANKI_BACK_TEMPLATE_FILEPATH", "")


    # Read the new back template from the file
    with open(template_filepath, 'r', encoding='utf-8') as file:
        new_back_template = file.read()
        update_anki_template(col_path, model_name, new_back_template)
