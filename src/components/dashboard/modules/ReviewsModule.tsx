import { ReviewList } from '@/components/reviews/ReviewList';

interface ReviewsModuleProps {
  salonId: string;
}

export function ReviewsModule({ salonId }: ReviewsModuleProps) {
  return (
    <ReviewList 
      salonId={salonId} 
      limit={50} 
      showOwnerActions={true} 
    />
  );
}
