import { useParams } from "react-router-dom";

import styles from '../../styles/doctor-details.module.css'
import { useEffect, useState } from "react";
import doctorService from "../../services/doctorService";
import { DoctorProfileDto } from "../../types/doctor.types";
import {Header } from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";

function DoctorDetails() {
    const [profileData, setProfileData] = useState<DoctorProfileDto>();
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    const { username } = useParams();

    const BioTab = () => <p>{profileData?.biography}</p>
    const RatingTab = () =>
        <div>
            <div className={styles["overview-header"]}>
                <h3 className={styles["overview-title"]}>Tổng quan:</h3>
                <div className={styles["overall-rating"]}>
                    <span className={styles["stars"]}>
                        {'★'.repeat(Math.round(profileData?.averageRating ?? 0)) +
                            '☆'.repeat(5 - Math.round(profileData?.averageRating ?? 0))}
                    </span>
                    <span className={styles["rating-number"]}>{profileData?.averageRating}/5</span>
                </div>
            </div>
            <h4 className={styles["rating-breakdown-title"]}>Chi tiết lượt đánh giá</h4>
            <div className={styles["rating-bar-group"]}>
                {profileData?.ratingByStar && (
                    <div className={styles["rating-bar-group"]}>
                        {profileData.ratingByStar.map((count: number, index: number) => {
                            const star = index + 1;
                            const totalRatings = profileData.ratingByStar.reduce((sum, c) => sum + c, 0);
                            const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

                            return (
                                <div className={styles["rating-bar-item"]} key={star}>
                                    <span className={styles["rating-label"]}>{star} ★</span>
                                    <div className={styles["rating-bar-container"]}>
                                        <div
                                            className={styles["rating-bar-fill"]}
                                            style={{ width: `${percentage.toFixed(1)}%` }}
                                        />
                                    </div>
                                    <span className={styles["rating-count-text"]}>({count}) Đánh giá</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className={styles["reviews-section"]}>
                <h4 className={styles["reviews-title"]}>Nhận xét về bác sĩ</h4>
                {profileData?.reviews.map((review) => (
                    <div className={styles["review-item"]}>
                        <div className={styles["review-header"]}>
                            <span className={styles["review-stars"]}>
                                {'★'.repeat(Math.round(review.rating)) +
                                    '☆'.repeat(5 - Math.round(review.rating))}
                            </span>
                            <span className={styles["review-date"]}>{review.date}</span>
                        </div>
                        <p className={styles["review-text"]}>{review.comment}</p>
                    </div>
                ))}
            </div>
        </div>

    const tabContents = [<BioTab />, <RatingTab />];

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await doctorService.getDoctorProfile(username);
                setProfileData(data);
                console.log(data);
            } catch (error) {
                console.error('Failed to fetch profile data:', error);
            }
        }
        fetchProfile();
    }, []);

    return (
        <div>
            <Header />
            <div className={styles["breadcrumb"]}>
                <a href="#">Trang chủ</a> / <a href="#">Bác sĩ</a> / <span>Chi Tiết Bác Sĩ</span>
            </div>
            {/* Main Content */}
            <div className={styles["container"]}>
                <h1 className={styles["page-title"]}>Chi Tiết Bác Sĩ</h1>
                {/* Doctor Profile */}
                <div className={styles["doctor-profile"]}>
                    <img className={styles["doctor-image"]} src={profileData?.avatarUrl} />
                    <div className={styles["doctor-info"]}>
                        <h3>Bác sĩ</h3>
                        <h2 className={styles["doctor-name"]}>{profileData?.fullName}</h2>
                        <div className={styles["rating-section"]}>
                            <span className={styles["stars"]}>
                                {'★'.repeat(Math.round(profileData?.averageRating ?? 0)) +
                                    '☆'.repeat(5 - Math.round(profileData?.averageRating ?? 0))}
                            </span>
                            <span className={styles["rating-number"]}>{profileData?.averageRating}/5</span>
                            <span className={styles["rating-count"]}>({profileData?.numberOfReviews} khách hàng đánh giá)</span>
                        </div>
                        <div className={styles["info-row"]}>
                            <span className={styles["info-label"]}>Chuyên khoa:</span>
                            <span className={styles["info-value"]}>{profileData?.specialization}</span>
                        </div>
                        <div className={styles["info-row"]}>
                            <span className={styles["info-label"]}>Trình độ học vấn:</span>
                            <span className={styles["info-value"]}>{profileData?.education}</span>
                        </div>
                    </div>
                </div>

                <div className={styles["tabs"]}>
                    <div className={styles["tab-buttons"]}>
                        {['Giới thiệu', 'Đánh giá'].map((label, i) => {
                            return <button
                                key={i}
                                className={`${styles['tab-btn']} ${activeTabIndex === i ? styles['active'] : ''}`}
                                onClick={() => setActiveTabIndex(i)}>
                                {label}
                            </button>
                        })}
                    </div>
                    <div className={styles["tab-content"]}>
                        {tabContents[activeTabIndex]}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default DoctorDetails;