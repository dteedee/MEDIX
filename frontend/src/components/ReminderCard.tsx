import React from "react";
import styles from "../../styles/ReminderCard.module.css";

interface ReminderCardProps {
  date: string;
  time: string;
  message: string;
  remaining: string;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ date, time, message, remaining }) => {
  return (
    <div className={styles.cardContainer}>
      <div className={styles.iconSection}>
        <i className="bi bi-calendar2-week-fill" style={{ fontSize: 40, color: "#ff7043" }}></i>
      </div>
      <div className={styles.contentSection}>
        {/* <div className={styles.remainTime}>{remaining}</div> */}
        <div className={styles.title}>Nhắc nhở lịch khám</div>
        <div className={styles.dateTime}><span>{date}</span> lúc <span>{time}</span></div>
        <div className={styles.message}>{message}</div>
      </div>
    </div>
  );
};

export default ReminderCard;
