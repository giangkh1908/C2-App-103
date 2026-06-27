#!/usr/bin/env python3
"""One-time script: promote an existing user to admin role.

Usage:
    python scripts/create_admin.py --email admin@example.com

Requirements:
    - pymongo
    - python-dotenv

This script refuses to run if any admin already exists in the database.
"""

import argparse
import os
import sys

try:
    from dotenv import load_dotenv
except ImportError:
    print("Loi: Thieu thu vien `python-dotenv`. Chay: pip install python-dotenv")
    sys.exit(1)

try:
    from pymongo import MongoClient
    from pymongo.errors import PyMongoError
except ImportError:
    print("Loi: Thieu thu vien `pymongo`. Chay: pip install pymongo")
    sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Thiet lap admin cho nguoi dung da ton tai."
    )
    parser.add_argument(
        "--email",
        required=True,
        help="Email cua nguoi dung muon thang cap len admin",
    )
    args = parser.parse_args()

    # Load .env tu backend/.env
    env_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "backend",
        ".env",
    )
    if not os.path.isfile(env_path):
        print(f"Khong tim thay file .env tai: {env_path}")
        sys.exit(1)

    load_dotenv(env_path)

    mongo_uri = os.getenv("MONGODB_URI")
    db_name = os.getenv("MONGODB_DB_NAME")

    if not mongo_uri or not db_name:
        print("Loi: Thieu bien moi truong MONGODB_URI hoac MONGODB_DB_NAME trong .env")
        sys.exit(1)

    # Ket noi MongoDB
    try:
        client = MongoClient(mongo_uri)
        db = client[db_name]
        users_coll = db["users"]
    except PyMongoError as e:
        print(f"Loi ket noi MongoDB: {e}")
        sys.exit(1)

    # Kiem tra admin da ton tai chua
    existing_admin = users_coll.find_one({"role": "admin"})
    if existing_admin:
        print(
            f"Tu choi: Da co admin ({existing_admin.get('email', 'khong ro')}) "
            "trong he thong. Chi duoc tao mot admin duy nhat."
        )
        client.close()
        sys.exit(1)

    # Tim nguoi dung theo email
    user = users_coll.find_one({"email": args.email})
    if user is None:
        print(f"Loi: Khong tim thay nguoi dung voi email '{args.email}'.")
        client.close()
        sys.exit(1)

    # Thang cap len admin
    try:
        users_coll.update_one({"_id": user["_id"]}, {"$set": {"role": "admin"}})
    except PyMongoError as e:
        print(f"Loi khi cap nhat role admin: {e}")
        client.close()
        sys.exit(1)

    print(f"Thanh cong! Nguoi dung '{args.email}' da duoc thang cap len admin.")
    client.close()


if __name__ == "__main__":
    main()
