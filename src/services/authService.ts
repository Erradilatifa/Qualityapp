import { auth, db } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  User,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

export interface UserData {
  matricule: string;
  fullName: string;
  projet: string;
  section: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterUserData {
  matricule: string;
  password: string;
  fullName: string;
  projet: string;
  section: string;
}

class AuthService {
  
  /**
   * Créer un nouvel utilisateur (admin uniquement)
   */
  async registerUser(userData: RegisterUserData): Promise<string> {
    try {
      // Vérifier si le matricule existe déjà
      const existingUser = await this.getUserByMatricule(userData.matricule);
      if (existingUser) {
        throw new Error('Un utilisateur avec ce matricule existe déjà');
      }

      // Créer un email temporaire basé sur le matricule
      const tempEmail = `${userData.matricule}@leoni-temp.com`;
      
      // Créer l'utilisateur Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        tempEmail, 
        userData.password
      );

      const user = userCredential.user;

      // Mettre à jour le profil avec le nom complet
      await updateProfile(user, {
        displayName: userData.fullName
      });

      // Créer le document utilisateur dans Firestore
      const userDoc: UserData = {
        matricule: userData.matricule,
        fullName: userData.fullName,
        projet: userData.projet,
        section: userData.section,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'users', user.uid), userDoc);

      console.log('Utilisateur créé avec succès:', user.uid);
      return user.uid;

    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      if (error instanceof Error) {
        throw new Error(`Échec de la création du compte: ${error.message}`);
      }
      throw new Error('Échec de la création du compte utilisateur');
    }
  }

  /**
   * Connexion avec matricule et mot de passe
   */
  async signInWithMatricule(matricule: string, password: string): Promise<UserData> {
    try {
      // Test login for demo
      if (matricule === 'ADMIN001' && password === 'admin123') {
        return {
          matricule: 'ADMIN001',
          fullName: 'Mehdi Fadil',
          projet: 'Quality Control',
          section: 'Administration',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        } as UserData;
      }
      
      // Récupérer l'utilisateur par matricule
      const userData = await this.getUserByMatricule(matricule);
      if (!userData) {
        throw new Error('Matricule non trouvé');
      }

      // Créer l'email temporaire
      const tempEmail = `${matricule}@leoni-temp.com`;
      
      // Se connecter avec Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, tempEmail, password);
      
      return userData;
    } catch (error: any) {
      console.error('Erreur lors de la connexion:', error);
      throw new Error(`Échec de la connexion: ${error.message}`);
    }
  }

  /**
   * Déconnexion
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      console.log('Déconnexion réussie');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw new Error('Échec de la déconnexion');
    }
  }

  /**
   * Récupérer l'utilisateur actuel
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Récupérer les données utilisateur par UID
   */
  async getUserData(uid: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as UserData;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
      return null;
    }
  }

  /**
   * Récupérer un utilisateur par matricule
   */
  async getUserByMatricule(matricule: string): Promise<UserData | null> {
    try {
      const q = query(
        collection(db, 'users'), 
        where('matricule', '==', matricule)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as UserData;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la recherche par matricule:', error);
      return null;
    }
  }

  /**
   * Mettre à jour les données utilisateur
   */
  async updateUserData(uid: string, updates: Partial<UserData>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      }, { merge: true });
      
      console.log('Données utilisateur mises à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw new Error('Échec de la mise à jour des données utilisateur');
    }
  }

  /**
   * Vérifier si l'utilisateur est admin
   */
  async isAdmin(uid: string): Promise<boolean> {
    try {
      const userData = await this.getUserData(uid);
      return userData?.role === 'admin';
    } catch (error) {
      console.error('Erreur lors de la vérification admin:', error);
      return false;
    }
  }

  /**
   * Lister tous les utilisateurs (admin uniquement)
   */
  async getAllUsers(): Promise<UserData[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const users: UserData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as UserData);
      });
      
      return users;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw new Error('Échec de la récupération des utilisateurs');
    }
  }

  /**
   * Supprimer un utilisateur (admin uniquement)
   */
  async deleteUser(uid: string): Promise<void> {
    try {
      // Note: La suppression de l'utilisateur Firebase Auth nécessite des privilèges admin
      // Pour l'instant, on supprime seulement le document Firestore
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { deleted: true, updatedAt: new Date() }, { merge: true });
      
      console.log('Utilisateur marqué comme supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw new Error('Échec de la suppression de l\'utilisateur');
    }
  }

  /**
   * Définir un utilisateur comme admin par email
   */
  async setUserAsAdminByEmail(email: string): Promise<void> {
    try {
      // Chercher l'utilisateur par email dans Firebase Auth
      const usersCollection = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollection);
      
      let userFound = false;
      
      for (const docSnap of querySnapshot.docs) {
        const userData = docSnap.data();
        // Vérifier si l'utilisateur correspond à l'email
        const tempEmail = `${userData.matricule}@leoni-temp.com`;
        
        if (tempEmail === email || userData.email === email) {
          // Mettre à jour le rôle en admin
          await setDoc(doc(db, 'users', docSnap.id), {
            role: 'admin',
            updatedAt: new Date()
          }, { merge: true });
          
          console.log(`Utilisateur ${email} défini comme admin`);
          userFound = true;
          break;
        }
      }
      
      if (!userFound) {
        // Si l'utilisateur n'existe pas encore, créer un document admin
        const adminData = {
          email: email,
          role: 'admin',
          fullName: 'Admin User',
          matricule: 'ADMIN001',
          projet: 'Administration',
          section: 'IT',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Utiliser l'email comme ID de document
        const adminId = email.replace(/[@.]/g, '_');
        await setDoc(doc(db, 'users', adminId), adminData);
        console.log(`Nouvel utilisateur admin créé: ${email}`);
      }
      
    } catch (error) {
      console.error('Erreur lors de la définition de l\'admin:', error);
      throw new Error('Échec de la définition de l\'utilisateur admin');
    }
  }
}

export const authService = new AuthService();
