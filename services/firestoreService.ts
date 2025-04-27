import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { app } from './firebase';
import { Owner, Hostel, Student } from '../types/hostelSchema';

export const db = getFirestore(app);

export const createOwnerDocument = async (uid: string, ownerData: Omit<Owner, 'hostels'>, initialHostel?: Hostel) => {
  try {
    const ownerRef = doc(db, 'owners', uid);
    await setDoc(ownerRef, {
      ...ownerData,
      hostels: initialHostel ? { [uid]: initialHostel } : {},
      createdAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error('Error creating owner document:', error);
    throw error;
  }
};

export const getOwnerDocument = async (uid: string) => {
  try {
    const ownerRef = doc(db, 'owners', uid);
    const ownerSnap = await getDoc(ownerRef);
    return ownerSnap.exists() ? ownerSnap.data() as Owner : null;
  } catch (error) {
    console.error('Error getting owner document:', error);
    throw error;
  }
};

export const createStudent = async (
  ownerId: string,
  hostelId: string,
  roomId: string,
  studentData: Omit<Student, 'payments'>
) => {
  try {
    const ownerRef = doc(db, 'owners', ownerId);
    const ownerDoc = await getDoc(ownerRef);
    
    if (!ownerDoc.exists()) {
      throw new Error('Owner not found');
    }

    const ownerData = ownerDoc.data() as Owner;
    const hostel = ownerData.hostels[hostelId];

    if (!hostel) {
      throw new Error('Hostel not found');
    }

    if (!hostel.rooms[roomId]) {
      throw new Error('Room not found');
    }

    // Create student ID
    const studentId = `student_${Date.now()}`;

    // Create student object
    const student: Student = {
      ...studentData,
      payments: {},
    };

    // Update hostel document
    await updateDoc(ownerRef, {
      [`hostels.${hostelId}.students.${studentId}`]: student,
      [`hostels.${hostelId}.rooms.${roomId}.students`]: arrayUnion(studentId),
      [`hostels.${hostelId}.rooms.${roomId}.isFull`]: hostel.rooms[roomId].students.length + 1 >= hostel.rooms[roomId].capacity,
    });

    return studentId;
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

export const createHostel = async (ownerId: string, hostelData: Omit<Hostel, 'rooms' | 'students' | 'notifications'>) => {
  try {
    const ownerRef = doc(db, 'owners', ownerId);
    const ownerDoc = await getDoc(ownerRef);
    
    if (!ownerDoc.exists()) {
      throw new Error('Owner not found');
    }

    // Create hostel ID
    const hostelId = `hostel_${Date.now()}`;

    // Create hostel object
    const hostel: Hostel = {
      ...hostelData,
      rooms: {},
      students: {},
      notifications: {},
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    // Update owner document with new hostel
    await updateDoc(ownerRef, {
      [`hostels.${hostelId}`]: hostel,
    });

    return hostelId;
  } catch (error) {
    console.error('Error creating hostel:', error);
    throw error;
  }
};

export const addRecentActivity = async (ownerId: string, activity: any) => {
  const activitiesRef = collection(db, 'owners', ownerId, 'recentActivities');
  await addDoc(activitiesRef, activity);
};

export const getRecentActivities = async (ownerId: string, max = 10) => {
  const activitiesRef = collection(db, 'owners', ownerId, 'recentActivities');
  const q = query(activitiesRef, orderBy('createdAt', 'desc'), limit(max));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateStudentStatus = async (
  ownerId: string,
  hostelId: string,
  studentId: string,
  isActive: boolean,
  leaveDate?: string
) => {
  try {
    const ownerRef = doc(db, 'owners', ownerId);
    const updates: any = {
      [`hostels.${hostelId}.students.${studentId}.isActive`]: isActive,
    };

    if (leaveDate) {
      updates[`hostels.${hostelId}.students.${studentId}.leaveDate`] = leaveDate;
    }

    await updateDoc(ownerRef, updates);
    return true;
  } catch (error) {
    console.error('Error updating student status:', error);
    throw error;
  }
}; 