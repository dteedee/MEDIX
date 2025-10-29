import { useState } from 'react';
import styles from '../../styles/manager/DoctorManagement.module.css'
import { PendingDoctorList } from './components/PendingDoctorList';
import { AllDoctorList } from './components/AllDoctorList';

export default function DoctorManagement() {
    const [tabIndex, setTabIndex] = useState<number>(0);

    const tabContents = [<AllDoctorList/>, <PendingDoctorList />];


    return (
        <>
            <div className={styles.container}>
                <div className='mb-5 d-flex justify-content-center'>
                    <button className={`btn mr-3 ${(tabIndex === 0) ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTabIndex(0)}>Tất cả bác sĩ</button>
                    <button className={`btn mr-3 ${(tabIndex === 1) ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setTabIndex(1)}>Chờ duyệt</button>
                </div>
                {tabContents[tabIndex]}
            </div>
        </>
    )
}