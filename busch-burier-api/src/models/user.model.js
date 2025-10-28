export class UserModel {
    constructor({ uid, email, firstName, lastName, photo, address, phone, createdAt, updatedAt }) {
        this.uid = uid;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.address = address;
        this.phone = phone;
        this.photo = photo;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromFirestore(doc) {
        const data = doc.data();
        return new UserModel({
            uid: doc.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            photo: data.photo,
            address: data.address,
            phone: data.phone,
            createdAt: data.createdAt?.toDate() || null,
            updatedAt: data.updatedAt?.toDate() || null,
        });
    }

    toFirestore() {
        return {
            email: this.email,
            firstName: this.firstName,
            lastName: this.lastName,
            photo: this.photo,
            address: this.address,
            phone: this.phone,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

