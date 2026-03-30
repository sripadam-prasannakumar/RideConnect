import os
import sys
import django
import requests
from django.core.files.base import ContentFile

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rideconnect_backend.settings")
django.setup()

from ride.models import CarBrand, CarModel


brand_data = {
    "Maruti Suzuki": {
        "logo_domain": "marutisuzuki.com",
        "models": ["Swift","Dzire","Baleno","Brezza","Ertiga","WagonR","Alto K10"]
    },
    "Tata Motors": {
        "logo_domain": "tatamotors.com",
        "models": ["Nexon","Punch","Harrier","Safari","Tiago","Altroz"]
    },
    "Mahindra": {
        "logo_domain": "mahindra.com",
        "models": ["Scorpio","Thar","XUV700","Bolero","XUV300"]
    },
    "Hyundai": {
        "logo_domain": "hyundai.com",
        "models": ["Creta","Venue","i20","Verna","Alcazar"]
    },
    "Honda": {
        "logo_domain": "honda.com",
        "models": ["City","Amaze","Elevate","Jazz"]
    },
    "Toyota": {
        "logo_domain": "toyota.com",
        "models": ["Fortuner","Innova Crysta","Glanza","Camry"]
    },
    "Kia": {
        "logo_domain": "kia.com",
        "models": ["Seltos","Sonet","Carens"]
    },
    "Renault": {
        "logo_domain": "renault.com",
        "models": ["Kwid","Triber","Kiger"]
    },
    "Nissan": {
        "logo_domain": "nissan.com",
        "models": ["Magnite","Kicks"]
    },
    "Volkswagen": {
        "logo_domain": "volkswagen.com",
        "models": ["Virtus","Taigun","Tiguan"]
    },
    "Skoda": {
        "logo_domain": "skoda-auto.com",
        "models": ["Slavia","Kushaq","Superb"]
    },
    "MG Motor": {
        "logo_domain": "mgmotor.co.in",
        "models": ["Hector","Astor","Gloster"]
    },
    "BMW": {
        "logo_domain": "bmw.com",
        "models": ["3 Series","5 Series","X1","X5"]
    },
    "Mercedes-Benz": {
        "logo_domain": "mercedes-benz.com",
        "models": ["C-Class","E-Class","S-Class","GLA"]
    },
    "Audi": {
        "logo_domain": "audi.com",
        "models": ["A4","A6","Q3","Q5"]
    },
    "Volvo": {
        "logo_domain": "volvocars.com",
        "models": ["XC40","XC60","XC90"]
    },
    "Jaguar": {
        "logo_domain": "jaguar.com",
        "models": ["F-PACE","I-PACE"]
    },
    "Land Rover": {
        "logo_domain": "landrover.com",
        "models": ["Range Rover","Defender","Discovery"]
    },
    "Porsche": {
        "logo_domain": "porsche.com",
        "models": ["911","Cayenne","Macan"]
    },
    "Ferrari": {
        "logo_domain": "ferrari.com",
        "models": ["Roma","F8 Tributo"]
    },
    "Lamborghini": {
        "logo_domain": "lamborghini.com",
        "models": ["Urus","Huracan"]
    },
    "Rolls-Royce": {
        "logo_domain": "rolls-roycemotorcars.com",
        "models": ["Phantom","Ghost","Cullinan"]
    },
    "Bentley": {
        "logo_domain": "bentleymotors.com",
        "models": ["Bentayga","Flying Spur"]
    }
}


def download_logo(url):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            return ContentFile(response.content)
    except Exception as e:
        print("Logo download error:", e)
    return None


def populate():

    print("Starting vehicle database population...")

    for brand_name, data in brand_data.items():

        logo_url = f"https://logo.clearbit.com/{data['logo_domain']}"

        brand, created = CarBrand.objects.get_or_create(
            brand_name=brand_name
        )

        if created:
            print(f"Created Brand: {brand_name}")
        else:
            print(f"Brand already exists: {brand_name}")

        # Download logo
        logo_file = download_logo(logo_url)
        
        if not logo_file:
            # Fallback to Google S2 Favicons if clearbit fails
            fallback_url = f"https://www.google.com/s2/favicons?domain={data['logo_domain']}&sz=128"
            print(f"  Clearbit failed for {brand_name}, trying fallback: {fallback_url}")
            logo_file = download_logo(fallback_url)

        if logo_file:
            brand.logo.save(f"{brand_name}.png", logo_file, save=True)
            print(f"  Logo saved for {brand_name}")
        else:
            print(f"  FAILED to download logo for {brand_name}")

        # Add models
        for model_name in data["models"]:
            model, model_created = CarModel.objects.get_or_create(
                brand=brand,
                model_name=model_name
            )

            if model_created:
                print(f"   + Model Added: {model_name}")

    print("Vehicle database population completed!")


if __name__ == "__main__":
    populate()